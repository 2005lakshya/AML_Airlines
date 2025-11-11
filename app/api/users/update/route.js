import { queryDatabase } from '@/lib/server-utils'
import sql from 'mssql'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body
    if (!email) return Response.json({ success: false, message: 'Email required' }, { status: 400 })

    console.log('[API /api/users/update] Update request for:', email, 'with data:', JSON.stringify(body, null, 2))

    // Fields mapping: only update provided fields (FrequentFlyerNumber excluded - auto-generated on signup)
    const fields = [
      'PhoneNumber','DateOfBirth','Gender','Nationality','StreetAddress','City','Country',
      'EmergencyContactName','EmergencyContactPhone','PreferredSeat','MealPreference',
      'DocumentType','DocumentNumber','DocumentExpiry','FirstName','LastName'
    ]

    const updates = []
    const params = []
    let idx = 0
    for (const f of fields) {
      let key = f;
      // Accept both camelCase and PascalCase from frontend
      if (f === 'FirstName') key = body.FirstName !== undefined ? 'FirstName' : 'firstName';
      if (f === 'LastName') key = body.LastName !== undefined ? 'LastName' : 'lastName';
      if (body[key] !== undefined && body[key] !== null) {
        idx += 1;
        updates.push(`${f} = @p${idx}`);
        // pick appropriate SQL type for known DATE fields
        if (f === 'DateOfBirth' || f === 'DocumentExpiry') {
          params.push({ name: `p${idx}`, type: sql.Date, value: body[key] });
        } else {
          params.push({ name: `p${idx}`, type: sql.NVarChar(4000), value: body[key] });
        }
      }
    }

    if (updates.length === 0) {
      return Response.json({ success: false, message: 'No fields to update' }, { status: 400 })
    }

    // add email param at end
    params.push({ name: 'email', type: sql.NVarChar(256), value: email })

    // Check if user exists
    const existing = await queryDatabase('SELECT UserID FROM Users WHERE Email = @email', [
      { name: 'email', type: sql.NVarChar(256), value: email }
    ]);

    if (existing && existing.length > 0) {
      // User exists, update
      const query = `UPDATE Users SET ${updates.join(', ')} WHERE Email = @email`;
      console.log('[API /api/users/update] Executing UPDATE query:', query, 'with params:', params)
      await queryDatabase(query, params);
      return Response.json({ success: true });
    } else {
      // User does not exist, insert with auto-generated FrequentFlyerNumber
      // Generate unique Frequent Flyer Number: AML + timestamp + random 4 digits
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(1000 + Math.random() * 9000);
      const frequentFlyerNumber = `AML${timestamp}${random}`;

      const insertFields = [
        'FirstName','LastName','Email','PhoneNumber','DateOfBirth','Gender','Nationality','StreetAddress','City','Country',
        'EmergencyContactName','EmergencyContactPhone','PreferredSeat','MealPreference',
        'DocumentType','DocumentNumber','DocumentExpiry','LoyaltyPoints','CreatedAt','PasswordHash','FrequentFlyerNumber'
      ];
      const insertParams = [];
      for (const f of insertFields) {
        let key = f;
        if (f === 'FirstName') key = 'firstName';
        if (f === 'LastName') key = 'lastName';
        if (f === 'Email') insertParams.push({ name: f, type: sql.NVarChar(256), value: email });
        else if (f === 'PasswordHash') insertParams.push({ name: f, type: sql.NVarChar(4000), value: 'COGNITO_USER' });
        else if (f === 'FrequentFlyerNumber') insertParams.push({ name: f, type: sql.NVarChar(50), value: frequentFlyerNumber });
        else if (f === 'LoyaltyPoints') insertParams.push({ name: f, type: sql.Int, value: 0 });
        else if (f === 'CreatedAt') insertParams.push({ name: f, type: sql.DateTime, value: new Date() });
        else if (f === 'DocumentExpiry' || f === 'DateOfBirth') insertParams.push({ name: f, type: sql.Date, value: body[key] || null });
        else insertParams.push({ name: f, type: sql.NVarChar(4000), value: body[key] || null });
      }
      const insertQuery = `INSERT INTO Users (${insertFields.join(', ')}) VALUES (${insertFields.map(f => '@' + f).join(', ')})`;
      await queryDatabase(insertQuery, insertParams);
      return Response.json({ success: true });
    }
  } catch (err) {
    console.error('Failed to update user profile', err)
    return Response.json({ success: false, error: err.message })
  }
}
