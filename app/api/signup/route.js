import { queryDatabase } from '@/lib/server-utils';
import sql from 'mssql';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[API /api/signup] incoming request from ', request.headers.get('x-forwarded-for') || request.headers.get('host') || 'unknown', 'payload:', body);

    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return Response.json({ message: 'First name, last name, email and password are required' }, { status: 400 });
    }

    const existing = await queryDatabase('SELECT UserID FROM Users WHERE Email = @email', [
      { name: 'email', type: sql.NVarChar(256), value: email }
    ]);
    console.log('[API /api/signup] existing user query result:', existing);

    if (existing && existing.length > 0) {
      return Response.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    // Generate unique Frequent Flyer Number: AML + timestamp + random 4 digits
    const generateFFN = () => {
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      return `AML${timestamp}${random}`;
    };

    const frequentFlyerNumber = generateFFN();

    const insertQuery = `INSERT INTO Users (FirstName, LastName, Email, PasswordHash, LoyaltyPoints, FrequentFlyerNumber, CreatedAt)
      OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FrequentFlyerNumber
      VALUES (@firstName, @lastName, @email, @pw, @lp, @ffn, GETDATE())`;

    const rows = await queryDatabase(insertQuery, [
      { name: 'firstName', type: sql.NVarChar(50), value: firstName },
      { name: 'lastName', type: sql.NVarChar(50), value: lastName },
      { name: 'email', type: sql.NVarChar(256), value: email },
      { name: 'pw', type: sql.NVarChar(4000), value: hashed },
      { name: 'lp', type: sql.Int, value: 0 },
      { name: 'ffn', type: sql.NVarChar(50), value: frequentFlyerNumber },
    ]);
    console.log('[API /api/signup] insert user query result:', rows);

    const userId = rows && rows[0] && (rows[0].UserID || rows[0].userid);
    const ffn = rows && rows[0] && (rows[0].FrequentFlyerNumber || rows[0].frequentflyernumber);
    console.log('[API /api/signup] created userId:', userId, 'with FFN:', ffn);
    return Response.json({ message: 'User created successfully', userId, frequentFlyerNumber: ffn }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
