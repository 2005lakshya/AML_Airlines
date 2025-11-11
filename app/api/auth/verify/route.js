import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1] // Bearer token

    if (!token) {
      return Response.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    return Response.json({
      message: 'Token is valid',
      user: {
        userId: decoded.userId,
        email: decoded.email
      }
    })

  } catch (error) {
    return Response.json(
      { message: 'Invalid token' },
      { status: 401 }
    )
  }
}

export async function POST(request) {
  // Logout endpoint - token blacklisting would be implemented here
  return Response.json({ message: 'Logged out successfully' })
}