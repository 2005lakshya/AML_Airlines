import { NextResponse } from 'next/server'
import { getOidcClient, newState, newNonce } from '@/lib/oidc'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

function required(name, val) {
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

export async function GET(req) {
  try {
    const client = await getOidcClient()
    const url = new URL(req.url)
    const next = url.searchParams.get('next') || '/profile'

    const state = newState()
    const nonce = newNonce()
    const scopes = (process.env.COGNITO_SCOPES || 'openid email profile').split(/\s+/).join(' ')

    // Explicitly pass redirect_uri from environment
    const redirectUri = required('COGNITO_REDIRECT_URI', process.env.COGNITO_REDIRECT_URI)
    
    // Production safety check
    if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(redirectUri)) {
      console.error('FATAL: COGNITO_REDIRECT_URI points to localhost in production:', redirectUri)
      throw new Error('Invalid COGNITO_REDIRECT_URI for production (points to localhost)')
    }

    console.log('[LOGIN] Using redirect_uri:', redirectUri)

    const authUrl = client.authorizationUrl({
      scope: scopes,
      state,
      nonce,
      redirect_uri: redirectUri,
    })

    const res = NextResponse.redirect(authUrl)
    const isProd = process.env.NODE_ENV === 'production'
    res.cookies.set('oidc_state', state, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 600, path: '/' })
    res.cookies.set('oidc_nonce', nonce, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 600, path: '/' })
    res.cookies.set('post_login_next', next, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 600, path: '/' })
    return res
  } catch (err) {
    console.error('OIDC login init failed:', err)
    return NextResponse.json({ success: false, error: 'OIDC init failed' }, { status: 500 })
  }
}
