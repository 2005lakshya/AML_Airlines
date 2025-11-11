import { queryDatabase } from '@/lib/server-utils'
import sql from 'mssql'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    if (!email) return Response.json({ success: false, message: 'email query required' }, { status: 400 })

    const rows = await queryDatabase('SELECT * FROM users WHERE email = @email', [
      { name: 'email', type: sql.NVarChar(256), value: email }
    ])
    const user = rows && rows[0] ? rows[0] : null
    return Response.json({ success: true, user })
  } catch (err) {
    console.error('/api/debug/user error', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
