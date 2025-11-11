import { queryDatabase } from '@/lib/server-utils';
import sql from 'mssql';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return Response.json({ message: 'Email and password required' }, { status: 400 });
    }

    // Debug: verify env variables are loaded in this API route (safe to log host and user)
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);

    const rows = await queryDatabase(
      'SELECT UserID, FirstName, LastName, Email, PasswordHash FROM Users WHERE Email = @email',
      [{ name: 'email', type: sql.NVarChar(256), value: email }]
    );

    if (!rows || rows.length === 0) {
      return Response.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];

    const bcrypt = require('bcryptjs');
    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.PasswordHash);
    } catch (e) {
      // if bcrypt compare fails (maybe legacy plain-text), fallback to direct compare
      valid = user.PasswordHash === password;
    }

    if (!valid) return Response.json({ message: 'Invalid credentials' }, { status: 401 });

    const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.Email;
    const safeUser = { id: user.UserID || user.userid, email: user.Email || user.email, name: fullName };
    return Response.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}