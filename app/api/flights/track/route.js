import { NextResponse } from 'next/server'

// Simple in-memory store for simulated flights (for demo)
const simulated = {}

// In-memory Amadeus token cache (process-lifetime). Not persisted across restarts.
let _amadeusToken = null
let _amadeusTokenExpiresAt = 0 // epoch ms

async function getAmadeusToken(clientId, clientSecret) {
  // Return cached token if valid for at least 30 seconds
  const now = Date.now()
  if (_amadeusToken && _amadeusTokenExpiresAt - 30000 > now) return _amadeusToken

  // Fetch new token
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    signal: AbortSignal.timeout(15000)
  })
  if (!res.ok) {
    throw new Error('Amadeus auth failed: ' + res.status)
  }
  const j = await res.json()
  const token = j.access_token
  const expiresIn = Number(j.expires_in) || 1800
  _amadeusToken = token
  _amadeusTokenExpiresAt = Date.now() + (expiresIn * 1000)
  return token
}

function simulateNext(pos) {
  // move slightly east and north
  return {
    lat: pos.lat + (Math.random() - 0.5) * 0.1,
    lon: pos.lon + (Math.random() - 0.5) * 0.1,
    alt: (pos.alt || 35000) + Math.round((Math.random() - 0.5) * 200),
    speed: (pos.speed || 450) + Math.round((Math.random() - 0.5) * 20),
  }
}

function normalizeStop(stop) {
  if (!stop || typeof stop !== 'object') return null
  const iataCode = stop.iataCode || stop.iata || stop.airportCode || stop.code || null
  const at = stop.at
    || stop.scheduledTime
    || stop.time
    || stop.scheduledTimeLocal
    || stop.scheduledLocal
    || stop.scheduled
    || null
  const terminal = stop.terminal || stop.terminalCode || null
  return { iataCode: iataCode || null, at: at || null, terminal: terminal || null }
}

async function tryAmadeusLookup(input, scheduledDate) {
  // Accept either a combined string (e.g., 'AI101') or an object
  // { carrierCode: 'AI', flightNumber: '101', scheduledDepartureDate: 'YYYY-MM-DD' }
  if (!input) return null

  let carrier = null
  let flightNumber = null
  let schedDateFromInput = null

  if (typeof input === 'string') {
    const s = input.trim().toUpperCase()
    const match = s.match(/^([A-Z]{2,3})(\d{1,4})$/)
    if (!match) return null
    carrier = match[1]
    flightNumber = match[2]
  } else if (typeof input === 'object') {
    carrier = (input.carrierCode || input.carrier || '').toString().trim().toUpperCase() || null
    flightNumber = input.flightNumber != null ? String(input.flightNumber).trim() : null
    // strip non-digits from flight number defensively
    if (flightNumber) flightNumber = flightNumber.replace(/[^0-9]/g, '')
    schedDateFromInput = input.scheduledDepartureDate || input.date || null
  }
  if (!carrier || !flightNumber) return null

  const clientId = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_KEY || undefined
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_SECRET || undefined

  // If no credentials available, don't try
  if (!clientId || !clientSecret) return null

  try {
    // Get (or reuse) Amadeus access token
    let accessToken
    try {
      accessToken = await getAmadeusToken(clientId, clientSecret)
    } catch (e) {
      console.warn('Amadeus auth failed', e)
      return null
    }

    // Always prefer the official On-Demand Flight Status endpoint: v2/schedule/flights
    // If no date provided, default to today's date (YYYY-MM-DD) local to server
  const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
  const preferDate = scheduledDate || schedDateFromInput
  const schedDate = (preferDate && /\d{4}-\d{2}-\d{2}/.test(preferDate)) ? preferDate : `${yyyy}-${mm}-${dd}`
    try {
      const scheduleUrl = `https://test.api.amadeus.com/v2/schedule/flights?carrierCode=${encodeURIComponent(carrier)}&flightNumber=${encodeURIComponent(flightNumber)}&scheduledDepartureDate=${encodeURIComponent(schedDate)}`
      const scheduleRes = await fetch(scheduleUrl, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
      if (scheduleRes.ok) {
        const scheduleJson = await scheduleRes.json()
        try { scheduleJson._endpoint = 'schedule' } catch (e) {}
        try { scheduleJson._requestUrl = scheduleUrl } catch (e) {}
        const d0 = Array.isArray(scheduleJson?.data) ? scheduleJson.data[0] : null
        if (d0) {
          let departure = null
          let arrival = null
          let duration = null
          const fp = Array.isArray(d0.flightPoints) ? d0.flightPoints : null
          if (fp && fp.length) {
            const first = fp[0]
            const last = fp[fp.length - 1]
            const depTiming = first?.departure?.timings?.[0]?.value || first?.departure?.timings?.find(t=>t.qualifier==='STD')?.value || null
            const arrTiming = last?.arrival?.timings?.[0]?.value || last?.arrival?.timings?.find(t=>t.qualifier==='STA')?.value || null
            departure = { iataCode: first?.iataCode || null, at: depTiming, terminal: first?.departure?.terminal || null }
            arrival = { iataCode: last?.iataCode || null, at: arrTiming, terminal: last?.arrival?.terminal || null }
          }
          duration = d0?.segments?.[0]?.scheduledSegmentDuration || d0?.legs?.[0]?.scheduledLegDuration || d0?.scheduledSegmentDuration || d0?.scheduledLegDuration || null
          return {
            status: scheduleJson?.status || d0?.status || 'scheduled',
            arrival,
            departure,
            duration,
            raw: scheduleJson
          }
        } else {
          // 200 OK but no data for this flight/date — fall back to status/schedules
          console.warn('Amadeus schedule returned no data; attempting fallbacks', { carrier, flightNumber, schedDate })
        }
      }
    } catch (e) {
      console.warn('Amadeus schedule lookup failed, trying fallback status API', e)
    }

    // Fallback: v1 operations flightstatus or older schedules endpoint
    const statusUrl = `https://test.api.amadeus.com/v1/operations/flightstatus?carrier=${carrier}&flightNumber=${flightNumber}`
    const statusRes = await fetch(statusUrl, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
    if (!statusRes.ok) {
      // Try alternative endpoint: older schedules endpoint
      const altUrl = `https://test.api.amadeus.com/v2/schedules?airline=${carrier}&flightNumber=${flightNumber}`
      const altRes = await fetch(altUrl, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000) })
      if (!altRes.ok) return null
      const altJson = await altRes.json()
      try { altJson._endpoint = 'schedules' } catch (e) {}
      try { altJson._requestUrl = altUrl } catch (e) {}
      // map altJson to simplified status
      const rec = Array.isArray(altJson?.data) && altJson.data.length ? altJson.data[0] : altJson
      const mapped = {
        status: rec?.status || altJson?.status || 'unknown',
        arrival: normalizeStop(rec?.arrival || altJson?.arrival),
        departure: normalizeStop(rec?.departure || altJson?.departure),
        raw: altJson
      }
      return mapped
    }

    const statusJson = await statusRes.json()
    try { statusJson._endpoint = 'status' } catch (e) {}
    try { statusJson._requestUrl = statusUrl } catch (e) {}
    // Map Amadeus status JSON to simplified object. Structure varies — try common fields
    const sr = Array.isArray(statusJson?.data) && statusJson.data.length ? statusJson.data[0] : statusJson
    const mapped = {
      status: sr?.status || statusJson?.status || 'unknown',
      arrival: normalizeStop(sr?.arrival || statusJson?.arrival),
      departure: normalizeStop(sr?.departure || statusJson?.departure),
      raw: statusJson
    }
    return mapped
  } catch (err) {
    console.warn('Amadeus lookup failed', err)
    return null
  }
}

async function tryADSBexchangeLookup(flight) {
  // flight like 'DAL1234' or 'AI101'
  // ADSBexchange offers free community endpoints that do not require a UUID.
  // If you have a paid UUID, set ADSBEXCHANGE_API_UUID or ADSBEXCHANGE_KEY.
  const apiUuid = process.env.ADSBEXCHANGE_API_UUID || process.env.ADSBEXCHANGE_KEY || null
  if (!flight) return null
  const callsign = flight.trim().toUpperCase()

  try {
    // Call by call sign first
    const url = `https://adsbexchange.com/api/aircraft/call/${encodeURIComponent(callsign)}/`
    const headers = apiUuid ? { 'api-auth': apiUuid } : {}
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      console.warn('ADSBexchange call sign lookup failed', res.status)
      return null
    }
    // Be defensive: ADSBexchange community endpoints sometimes return non-JSON
    // (HTML, text). Check content-type and attempt safe parsing with fallbacks.
    const contentType = (res.headers.get && res.headers.get('content-type')) || ''
    let json = null
    if (contentType.toLowerCase().includes('application/json') || contentType.toLowerCase().includes('text/json')) {
      try {
        json = await res.json()
      } catch (err) {
        console.warn('Failed to parse ADSBexchange JSON (content-type claimed JSON)', err)
      }
    } else {
      // Try to parse response text and extract JSON object if possible
      const text = await res.text()
      try {
        json = JSON.parse(text)
      } catch (err) {
        // Try to locate a JSON object within the text
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1 && end > start) {
          const maybe = text.slice(start, end + 1)
          try {
            json = JSON.parse(maybe)
          } catch (err2) {
            console.warn('ADSBexchange returned non-JSON response (extracted snippet failed):', maybe.slice(0,200))
          }
        } else {
          console.warn('ADSBexchange returned non-JSON response:', text.slice(0,200))
        }
      }
    }
    // The ADSBexchange JSON has an "ac" array with aircraft objects; choose the first
    const ac = Array.isArray(json?.ac) && json.ac.length ? json.ac[0] : null
    if (!ac) return null

    // Map ADSB fields to our shape
    const mapped = {
      lat: ac?.lat || null,
      lon: ac?.lon || null,
      alt: ac?.alt || ac?.alt_geom || null,
      speed: ac?.gs || ac?.spd || null,
      icao: ac?.hex || ac?.icao || null,
      raw: json
    }
    return mapped
  } catch (err) {
    console.warn('ADSBexchange lookup failed', err)
    return null
  }
}

// Map of common IATA codes to lat/lon for quick area queries. Extend as needed.
const airportCoords = {
  DEL: { lat: 28.556163, lon: 77.099957 }, // Indira Gandhi Intl
  BOM: { lat: 19.089559, lon: 72.865614 }, // Mumbai
  BLR: { lat: 13.198635, lon: 77.706325 }, // Bengaluru
  MAA: { lat: 12.994129, lon: 80.170868 }, // Chennai
  HYD: { lat: 17.231320, lon: 78.429630 }, // Hyderabad
  CCU: { lat: 22.654, lon: 88.446 }, // Kolkata
  COK: { lat: 10.152, lon: 76.401 }, // Kochi
  BOM: { lat: 19.0896, lon: 72.8656 },
  DEL: { lat: 28.5562, lon: 77.0996 },
  LHR: { lat: 51.4700, lon: -0.4543 },
  JFK: { lat: 40.6413, lon: -73.7781 }
}

async function tryADSBAreaLookup(lat, lon, dist = 100) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  const url = `https://api.adsbexchange.com/v2/lat/${lat}/lon/${lon}/dist/${dist}/`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      console.warn('ADSBexchange area lookup failed', res.status)
      return null
    }

    const contentType = (res.headers.get && res.headers.get('content-type')) || ''
    let json = null
    if (contentType.toLowerCase().includes('application/json') || contentType.toLowerCase().includes('text/json')) {
      try { json = await res.json() } catch (err) { console.warn('Failed to parse ADSB area JSON', err) }
    } else {
      const text = await res.text()
      try { json = JSON.parse(text) } catch (err) {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1 && end > start) {
          try { json = JSON.parse(text.slice(start, end + 1)) } catch (err2) { console.warn('ADSBarea returned non-JSON:', text.slice(0,200)) }
        } else {
          console.warn('ADSBarea returned non-JSON:', text.slice(0,200))
        }
      }
    }

    return json
  } catch (err) {
    console.warn('ADSBexchange area lookup failed', err)
    return null
  }
}

function findAircraftInArea(areaJson, flight) {
  if (!areaJson) return null
  const list = Array.isArray(areaJson?.ac) ? areaJson.ac : (Array.isArray(areaJson) ? areaJson : [])
  const f = (flight || '').toUpperCase().replace(/\s+/g, '')
  for (const ac of list) {
    const callsign = (ac?.call || ac?.cs || ac?.callsign || '')?.toString()?.toUpperCase()
    const flightField = (ac?.flight || '')?.toString()?.toUpperCase()
    if (callsign && callsign.includes(f)) return ac
    if (flightField && flightField.includes(f)) return ac
    // Some providers include registration or other hints
    if (ac?.hex && ac.hex.toUpperCase().includes(f)) return ac
  }
  return null
}

export async function POST(req) {
  try {
  const body = await req.json()
  const { query, options, date, carrierCode, flightNumber, scheduledDepartureDate } = body || {}
  const opts = options || {}
  const useAmadeus = opts.useAmadeus !== false // default true
  const useADSBarea = opts.useADSBarea !== false // default true
  const useADSBdirect = opts.useADSBdirect !== false // default true
  const useExternal = opts.useExternal === true

  const attempted = { amadeus: false, adsb_area: false, adsb_direct: false, external: false }

    // If external tracker configured and client asked for it, proxy it
    const trackerUrl = process.env.FLIGHT_TRACKER_URL
    const trackerKey = process.env.FLIGHT_TRACKER_KEY
    if (trackerUrl && useExternal) {
      attempted.external = true
      try {
        const res = await fetch(trackerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(trackerKey ? { 'Authorization': `Bearer ${trackerKey}` } : {})
          },
          body: JSON.stringify({ query })
        })
        if (!res.ok) return NextResponse.json({ success: false, error: 'External tracker error' }, { status: 502 })
        const json = await res.json()
        // Ensure response includes a source marker for the client UI
        return NextResponse.json({ success: true, data: { ...(json || {}), source: 'external', attempted } })
      } catch (err) {
        console.error('Tracker proxy failed', err)
        // fallback to local Amadeus/simulation
      }
    }

    // Normalize inputs (prefer structured fields if provided)
    const cCode = (carrierCode || '').toString().trim().toUpperCase() || null
    const fNum = flightNumber != null ? String(flightNumber).trim().replace(/[^0-9]/g, '') : null
    const schedDate = scheduledDepartureDate || date || null
    const callsign = (cCode && fNum) ? `${cCode}${fNum}` : (query || '')

    // First, try Amadeus for flight status/details (to get departure/arrival)
    let amadeusData = null
    if (useAmadeus) {
      attempted.amadeus = true
      const amInput = (cCode && fNum) ? { carrierCode: cCode, flightNumber: fNum, scheduledDepartureDate: schedDate } : (query || null)
      amadeusData = await tryAmadeusLookup(amInput, schedDate)
    }

    // Determine an area center (lat/lon) from Amadeus data if available
    let center = null
    const depIata = amadeusData?.departure?.iataCode || amadeusData?.departure?.iata || null
    const arrIata = amadeusData?.arrival?.iataCode || amadeusData?.arrival?.iata || null
    if (depIata && airportCoords[depIata]) center = airportCoords[depIata]
    else if (arrIata && airportCoords[arrIata]) center = airportCoords[arrIata]

    // Fallback center to Delhi if nothing found
    if (!center) center = { lat: 28.6, lon: 77.2 }

    // Try ADSB area lookup around the center and search for matching aircraft
    let areaJson = null
    let foundAc = null
    if (useADSBarea) {
      attempted.adsb_area = true
      areaJson = await tryADSBAreaLookup(center.lat, center.lon, 100)
      foundAc = findAircraftInArea(areaJson, callsign)
    }

    // If not found in area, try direct callsign endpoint as a fallback
    if (!foundAc && useADSBdirect) {
      attempted.adsb_direct = true
      // try direct call endpoint (may return single aircraft)
      const direct = await tryADSBexchangeLookup(callsign)
      if (direct) {
        foundAc = {
          lat: direct.lat,
          lon: direct.lon,
          alt_baro: direct.alt,
          gs: direct.speed,
          call: callsign,
          hex: direct.icao,
          _raw: direct.raw
        }
      }
    }

    // If we found ADSB aircraft, map and return it
    if (foundAc) {
      const mapped = {
        lat: Number(foundAc.lat) || Number(foundAc?.lat_baro) || Number(foundAc?.lat_deg) || null,
        lon: Number(foundAc.lon) || Number(foundAc?.lon_baro) || Number(foundAc?.lon_deg) || null,
        alt: foundAc.alt_baro || foundAc.alt || foundAc.alt_geom || null,
        speed: foundAc.gs || foundAc.groundspeed || foundAc.spd || null,
        callsign: foundAc.callsign || foundAc.call || foundAc.flight || callsign,
        icao: foundAc.hex || foundAc.icao || null,
        operator: foundAc.operator || foundAc.op || null,
        reg: foundAc.reg || foundAc.registration || null,
        flight: callsign,
        status: amadeusData?.status || 'on-time',
        arrival: amadeusData?.arrival || null,
        departure: amadeusData?.departure || null,
        adsb_raw: foundAc._raw || areaJson || null,
        amadeus_raw: amadeusData?.raw || null,
        source: 'adsb',
        attempted
      }
      simulated[query] = { ...mapped }
      return NextResponse.json({ success: true, data: simulated[query] })
    }

    // If no ADSB match, fall back to previous flow (simulation + Amadeus)

    // No direct ADSB object named `adsbData` exists here; any ADSB-derived
    // information is already handled above (foundAc / direct). If we reach
    // this point, there was no ADSB match and we'll fall through to simulation.

  // Fallback to simulation (seeded by query)
    if (!simulated[callsign || query]) {
      // random starting point over India for example
      simulated[callsign || query] = {
        lat: 20 + Math.random() * 10,
        lon: 75 + Math.random() * 10,
        alt: 34000 + Math.round(Math.random()*2000),
        speed: 420 + Math.round(Math.random()*80),
        flight: callsign || query,
        status: amadeusData?.status || 'on-time',
        source: amadeusData ? 'amadeus' : 'simulated',
        amadeus_raw: amadeusData?.raw || null
      }
    } else {
      const key = callsign || query
      simulated[key] = { ...simulated[key], ...simulateNext(simulated[key]) }
      // If Amadeus provided updated status fields, merge them
      if (amadeusData?.status) simulated[callsign || query].status = amadeusData.status
    }

    // If Amadeus gave arrival/departure we can include those
    if (amadeusData?.arrival) simulated[callsign || query].arrival = amadeusData.arrival
    if (amadeusData?.departure) simulated[callsign || query].departure = amadeusData.departure

    // Include attempted flags so the client can show accurate checks
    return NextResponse.json({ success: true, data: { ...(simulated[callsign || query] || {}), attempted } })
  } catch (err) {
    console.error('track route error', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
