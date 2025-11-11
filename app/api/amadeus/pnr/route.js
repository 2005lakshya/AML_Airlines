import { NextResponse } from 'next/server'

async function getAmadeusAccessToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_KEY
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_SECRET

  if (!clientId || !clientSecret) return null

  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(request) {
  try {
    const { pnr } = await request.json()
    if (!pnr || typeof pnr !== 'string' || pnr.length < 5) {
      return NextResponse.json({ success: false, error: 'Invalid PNR' }, { status: 400 })
    }

    const accessToken = await getAmadeusAccessToken()
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Amadeus auth failed' }, { status: 500 })
    }

    // Amadeus PNR Retrieval API (Order Management)
    // See: https://developers.amadeus.com/self-service-apis/order-management/api-reference
    // This endpoint may require a booking reference and last name
    // For demo, we'll use /v1/booking/flight-orders/{pnr}
    const amadeusUrl = `https://test.api.amadeus.com/v1/booking/flight-orders/${pnr}`
    const res = await fetch(amadeusUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const data = await res.json()

    if (res.ok && data) {
      return NextResponse.json({ success: true, data })
    } else {
      return NextResponse.json({ success: false, error: data?.errors?.[0]?.detail || 'Not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Amadeus PNR lookup error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
