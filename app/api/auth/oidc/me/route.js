import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

function parseCookies(header) {
  const cookieHeader = header || ''
  const map = Object.fromEntries(cookieHeader.split(/;\s*/).filter(Boolean).map(kv => {
    const idx = kv.indexOf('=')
    if (idx === -1) return [kv, '']
    return [decodeURIComponent(kv.slice(0, idx)), decodeURIComponent(kv.slice(idx + 1))]
  }))
  return map
}

export async function GET(req) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const token = cookies['aml_session']
    if (!token) return NextResponse.json({ success: false, error: 'No session' }, { status: 401 })

    const secret = process.env.AUTH_SESSION_SECRET
    if (!secret) return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 })

    const payload = jwt.verify(token, secret)
    return NextResponse.json({ success: true, user: payload.userInfo || { sub: payload.sub, email: payload.email, name: payload.name } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
  }
}
