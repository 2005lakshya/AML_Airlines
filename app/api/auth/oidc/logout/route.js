import { NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const origin = new URL(req.url).origin
    const domain = process.env.COGNITO_DOMAIN
    const clientId = process.env.COGNITO_CLIENT_ID
    const postLogout = process.env.COGNITO_LOGOUT_REDIRECT_URI || `${origin}/`

    const res = NextResponse.redirect(`${domain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(postLogout)}`)
    const isProd = process.env.NODE_ENV === 'production'
    // Clear session cookie
    res.cookies.set('aml_session', '', { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 0, path: '/' })
    return res
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.redirect('/')
  }
}
