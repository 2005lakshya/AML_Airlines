import { queryDatabase } from '@/lib/server-utils';
import sql from 'mssql';

export async function GET(request) {
  try {
    const users = await queryDatabase('SELECT * FROM Users', []);
    return Response.json({ success: true, data: users });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('/api/users POST body:', body)
    const { Name, FullName, Email, PasswordHash, email } = body;

    // If caller passed only `email` (lowercase), treat this as a lookup request and return the user
    const lookupEmail = email || Email || body.emailAddress || null;
    if (lookupEmail) {
      const rows = await queryDatabase('SELECT * FROM Users WHERE Email = @email', [
        { name: 'email', type: sql.NVarChar(256), value: lookupEmail }
      ]);
      const userRow = rows && rows[0] ? rows[0] : null;
      if (!userRow) return Response.json({ success: false, user: null }, { status: 404 });
      const user = {
        id: userRow.UserID || userRow.userid,
        name: userRow.FullName || userRow.Name || userRow.name,
        email: userRow.Email || userRow.email,
        ...userRow
      };
      return Response.json({ success: true, user });
    }

    // Otherwise expect full create payload (FullName, Email, PasswordHash)
    const createName = FullName || Name;
    if (!createName || !Email || !PasswordHash) {
      return Response.json({ success: false, error: 'Missing required fields (FullName, Email, PasswordHash expected for create)' }, { status: 400 });
    }

    const rows = await queryDatabase(
      'INSERT INTO Users (FullName, Email, PasswordHash) OUTPUT INSERTED.* VALUES (@name, @email, @pw)',
      [
        { name: 'name', type: sql.NVarChar(200), value: createName },
        { name: 'email', type: sql.NVarChar(256), value: Email },
        { name: 'pw', type: sql.NVarChar(4000), value: PasswordHash },
      ]
    );

    const inserted = rows && rows[0] ? rows[0] : null;
    const user = inserted ? { id: inserted.UserID || inserted.userid, name: inserted.FullName || inserted.Name, email: inserted.Email } : null;
    return Response.json({ success: true, data: user });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}