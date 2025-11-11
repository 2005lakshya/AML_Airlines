import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getOidcClient } from '@/lib/oidc'
import { queryDatabase } from '@/lib/server-utils'
import sql from 'mssql'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

function required(name, val) {
  if (!val) throw new Error(`Missing ${name}`)
  return val
}

// Save or update user in database after Cognito login
async function saveUserToDatabase(userInfo) {
  try {
    console.log('Cognito userInfo received:', JSON.stringify(userInfo, null, 2))
    
    const email = userInfo.email
    // Cognito only provides 'name' field (first name only)
    const firstName = userInfo.name || userInfo.preferred_username || email.split('@')[0]
    
    console.log('Parsed firstName from Cognito:', firstName)
    
    // Check if user exists
    const existingUsers = await queryDatabase(
      'SELECT UserID, FirstName, LastName FROM Users WHERE Email = @email',
      [{ name: 'email', type: sql.NVarChar(256), value: email }]
    )

    if (existingUsers && existingUsers.length > 0) {
      // User exists, only update FirstName (preserve LastName if user already filled it)
      const existingLastName = existingUsers[0].LastName
      await queryDatabase(
        'UPDATE Users SET FirstName = @firstName WHERE Email = @email',
        [
          { name: 'firstName', type: sql.NVarChar(100), value: firstName },
          { name: 'email', type: sql.NVarChar(256), value: email }
        ]
      )
      console.log('Updated existing user:', email, 'FirstName:', firstName, 'LastName preserved:', existingLastName)
    } else {
      // Generate unique Frequent Flyer Number: AML + timestamp + random 4 digits
      const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
      const random = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
      const frequentFlyerNumber = `AML${timestamp}${random}`

      // Create new user (no password needed for Cognito users, LastName will be filled in profile)
      await queryDatabase(
        'INSERT INTO Users (FirstName, LastName, Email, PasswordHash, LoyaltyPoints, FrequentFlyerNumber, CreatedAt) VALUES (@firstName, @lastName, @email, @passwordHash, @loyaltyPoints, @frequentFlyerNumber, GETDATE())',
        [
          { name: 'firstName', type: sql.NVarChar(100), value: firstName },
          { name: 'lastName', type: sql.NVarChar(100), value: '' }, // Empty, user will fill in profile
          { name: 'email', type: sql.NVarChar(256), value: email },
          { name: 'passwordHash', type: sql.NVarChar(4000), value: 'COGNITO_USER' }, // Placeholder for Cognito users
          { name: 'loyaltyPoints', type: sql.Int, value: 0 },
          { name: 'frequentFlyerNumber', type: sql.NVarChar(50), value: frequentFlyerNumber }
        ]
      )
      console.log('Created new user from Cognito:', email, 'with FFN:', frequentFlyerNumber, 'FirstName:', firstName, 'LastName: (empty - user will fill)')
    }
  } catch (err) {
    console.error('Failed to save user to database:', err)
    // Don't throw - allow login to proceed even if DB save fails
  }
}

export async function GET(req) {
  try {
    const client = await getOidcClient()
    const url = new URL(req.url)

    const cookies = req.cookies || {}
    // Next.js Request doesn't expose cookies directly; use headers cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const cookieMap = Object.fromEntries(cookieHeader.split(/;\s*/).filter(Boolean).map(kv => {
      const idx = kv.indexOf('=')
      if (idx === -1) return [kv, '']
      return [decodeURIComponent(kv.slice(0, idx)), decodeURIComponent(kv.slice(idx + 1))]
    }))

    const state = cookieMap['oidc_state']
    const nonce = cookieMap['oidc_nonce']
    const next = cookieMap['post_login_next'] || '/profile'
    const redirectUri = required('COGNITO_REDIRECT_URI', process.env.COGNITO_REDIRECT_URI)

    // Extract params from callback URL
    const params = Object.fromEntries(url.searchParams.entries())

    const tokenSet = await client.callback(redirectUri, params, { state, nonce })
    const userInfo = await client.userinfo(tokenSet.access_token)

    // Save/update user in database
    await saveUserToDatabase(userInfo)

    // Create a signed session JWT (HttpOnly cookie)
    const secret = required('AUTH_SESSION_SECRET', process.env.AUTH_SESSION_SECRET)
    const payload = {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.username || userInfo.preferred_username || undefined,
      userInfo,
    }
    const sessionJwt = jwt.sign(payload, secret, { expiresIn: '2h' })

    // Determine safe redirect target (defaults to profile)
    let targetPath = typeof next === 'string' && next.startsWith('/') ? next : '/profile'
    try {
      // Guard against open redirects: only same-origin paths are allowed
      const maybeUrl = new URL(next, url.origin)
      if (maybeUrl.origin === url.origin) {
        targetPath = maybeUrl.pathname + (maybeUrl.search || '') + (maybeUrl.hash || '')
      }
    } catch {}
//fine
    // In production, force redirect to the correct domain from COGNITO_LOGOUT_REDIRECT_URI
    let redirectOrigin = url.origin
    if (process.env.NODE_ENV === 'production') {
      const productionBase = process.env.COGNITO_LOGOUT_REDIRECT_URI || process.env.COGNITO_REDIRECT_URI
      if (productionBase) {
        try {
          redirectOrigin = new URL(productionBase).origin
          console.log('[CALLBACK] Forcing production origin:', redirectOrigin)
        } catch (e) {
          console.error('[CALLBACK] Invalid production redirect URI:', e)
        }
      }
    }

    console.log('[CALLBACK] Final redirect:', `${redirectOrigin}${targetPath}`)
    const res = NextResponse.redirect(new URL(targetPath, redirectOrigin))
    const isProd = process.env.NODE_ENV === 'production'
    res.cookies.set('aml_session', sessionJwt, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 2 * 60 * 60, path: '/' })
  // Clear transient cookies
  res.cookies.set('oidc_state', '', { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 0, path: '/' })
  res.cookies.set('oidc_nonce', '', { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 0, path: '/' })
  res.cookies.set('post_login_next', '', { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 0, path: '/' })
    return res
  } catch (err) {
    console.error('OIDC callback failed:', err)
    return NextResponse.redirect(new URL('/auth?error=callback', req.url))
  }
}
