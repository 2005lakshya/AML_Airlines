import { NextResponse } from 'next/server'

// POST /api/loyalty/verify
export async function POST(req) {
  try {
    const body = await req.json()
    const { pnr, flightNumber, date } = body || {}

    // If an external API is configured, proxy the request.
    const apiUrl = process.env.AIRLINE_API_URL
    const apiKey = process.env.AIRLINE_API_KEY

    if (apiUrl) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({ pnr, flightNumber, date })
        })

        if (!res.ok) {
          const text = await res.text()
          return NextResponse.json({ success: false, error: 'External API error', details: text }, { status: 502 })
        }

        const json = await res.json()
        // Expect external API to return { amount, status }
        return NextResponse.json({ success: true, provider: 'external', data: json })
      } catch (err) {
        console.error('External API proxy failed', err)
        // fall through to mock
      }
    }

    // No external API configured or proxy failed — return deterministic mock response
    // Generate a pseudo-random but deterministic amount based on pnr/flightNumber
    const seed = (pnr || '') + '|' + (flightNumber || '')
    let hash = 0
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i) | 0
    const amount = Math.max(500, Math.abs(hash) % 15000) + 500 // between 500 and ~15500

    const statuses = ['on-time', 'delayed', 'cancelled']
    const status = statuses[Math.abs(hash) % statuses.length]

    return NextResponse.json({ success: true, provider: 'mock', data: { amount, status } })
  } catch (err) {
    console.error('verify route error', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
