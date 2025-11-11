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
    const { email, name, password, FullName } = body || {};

    // If only email is provided, treat this as a lookup request used by the client
    if (email && !name && !password && !FullName) {
      const rows = await queryDatabase(
        'SELECT * FROM Users WHERE Email = @email',
        [{ name: 'email', type: sql.NVarChar(256), value: email }]
      );
      if (!rows || rows.length === 0) {
        return Response.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      const r = rows[0];
      // return normalized fields + all DB columns at top-level so client can map
      const user = {
        id: r.UserID || r.userid,
        name: r.FullName || r.Name || r.name,
        email: r.Email || r.email,
        ...r
      };
      console.log('[API /api/users] User lookup result:', user);
      return Response.json({ success: true, user }, { status: 200 });
    }

    // Otherwise require name/fullname and password to create a new user
    const createName = FullName || name;
    if (!email || !createName || !password) {
      return Response.json(
        { message: 'Email, full name, and password are required' },
        { status: 400 }
      );
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const rows = await queryDatabase(
      'INSERT INTO Users (FullName, Email, PasswordHash) OUTPUT INSERTED.UserID, INSERTED.Email VALUES (@name, @email, @hpw)',
      [
        { name: 'name', type: sql.NVarChar(200), value: createName },
        { name: 'email', type: sql.NVarChar(256), value: email },
        { name: 'hpw', type: sql.NVarChar(4000), value: hashedPassword },
      ]
    );

    const userId = rows && rows[0] && (rows[0].UserID || rows[0].userid);

    return Response.json({ message: 'User created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Error creating/looking up user:', error);
    if (error.message && error.message.includes('Duplicate')) {
      return Response.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
    }
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}