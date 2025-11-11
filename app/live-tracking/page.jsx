"use client"

import { useState } from 'react'
import Footer from '@/components/footer'

function safeGetIata(field) {
  if (!field) return null
  if (typeof field === 'string') return field.toUpperCase()
  if (typeof field === 'object') return (field.iataCode || field.iata || field.code || null)?.toString().toUpperCase() || null
  return null
}

function safeGetTime(field) {
  if (!field) return null
  if (typeof field === 'string') return field
  if (typeof field === 'object') return field.at || field.scheduledTime || field.time || null
  return null
}

function parseAmadeusRaw(raw) {
  if (!raw) return null
  // If the payload is from On-Demand Flight Status (v2/schedule/flights)
  const d0 = Array.isArray(raw?.data) && raw.data.length ? raw.data[0] : null
  const flightPoints = Array.isArray(d0?.flightPoints) ? d0.flightPoints : null
  if (flightPoints && flightPoints.length) {
    const first = flightPoints[0]
    const last = flightPoints[flightPoints.length - 1]
    const findTiming = (timings, pref) => {
      if (!Array.isArray(timings) || !timings.length) return null
      const prefHit = timings.find(t => t?.qualifier === pref)
      return prefHit?.value || timings[0]?.value || null
    }
    const depAt = findTiming(first?.departure?.timings, 'STD')
    const arrAt = findTiming(last?.arrival?.timings, 'STA')
    const duration = d0?.segments?.[0]?.scheduledSegmentDuration
      || d0?.legs?.[0]?.scheduledLegDuration
      || d0?.scheduledSegmentDuration
      || d0?.scheduledLegDuration
      || null
    const carrier = d0?.flightDesignator?.carrierCode || null
    const flightNumber = d0?.flightDesignator?.flightNumber != null ? String(d0.flightDesignator.flightNumber) : null
    return {
      carrier,
      flightNumber,
      departure: { iataCode: first?.iataCode || null, at: depAt, terminal: first?.departure?.terminal || null },
      arrival: { iataCode: last?.iataCode || null, at: arrAt, terminal: last?.arrival?.terminal || null },
      duration,
      status: raw?.status || d0?.status || null,
      raw
    }
  }

  // Fallback: older shapes with itineraries/segments
  const rec = Array.isArray(raw?.data) && raw.data.length ? raw.data[0] : raw
  const seg = rec?.itineraries?.[0]?.segments?.[0] || rec?.segments?.[0] || null
  const carrier = seg?.carrierCode || rec?.carrierCode || rec?.carrier || rec?.airline || null
  const flightNumber = seg?.number || rec?.flightNumber || rec?.flight?.number || rec?.flight?.identification || null
  const departure = seg?.departure || rec?.departure || (rec?.itineraries?.[0]?.segments?.[0]?.departure) || null
  const arrival = seg?.arrival || rec?.arrival || (rec?.itineraries?.[0]?.segments?.slice(-1)?.[0]?.arrival) || null
  const duration = rec?.itineraries?.[0]?.duration || rec?.duration || null
  const depIata = departure?.iataCode || departure?.iata || departure?.airportCode || null
  const arrIata = arrival?.iataCode || arrival?.iata || arrival?.airportCode || null
  const depAt = departure?.at || departure?.scheduledTime || departure?.time || null
  const arrAt = arrival?.at || arrival?.scheduledTime || arrival?.time || null
  const depTerminal = departure?.terminal || null
  const arrTerminal = arrival?.terminal || null
  return {
    carrier,
    flightNumber: flightNumber ? flightNumber.toString() : null,
    departure: { iataCode: depIata, at: depAt, terminal: depTerminal },
    arrival: { iataCode: arrIata, at: arrAt, terminal: arrTerminal },
    duration,
    status: rec?.status || raw?.status || null,
    raw: rec
  }
}

export default function LiveTrackingPage() {
  const [carrier, setCarrier] = useState('')
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState('')
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(null)
  const [showRaw, setShowRaw] = useState(false)

  async function lookupFlight(e) {
    if (e && e.preventDefault) e.preventDefault()
    setError(null)
    setDetails(null)
    const c = (carrier || '').trim().toUpperCase()
    const n = (number || '').trim()
    if (!c || !n) return setError('Enter carrier code (e.g., AI) and flight number (e.g., 101).')
    if (!/^([A-Z]{2,3})$/.test(c)) return setError('Carrier code must be 2–3 letters (IATA code).')
    if (!/^\d{1,4}$/.test(n)) return setError('Flight number must be 1–4 digits.')
    setLoading(true)
    try {
      // Prefer Amadeus for authoritative flight details. Disable ADSB lookups so server will return Amadeus data if available.
      const res = await fetch('/api/flights/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierCode: c, flightNumber: n, scheduledDepartureDate: date || undefined, options: { useAmadeus: true, useADSBarea: false, useADSBdirect: false, useExternal: false } })
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Lookup failed')
        setLoading(false)
        return
      }
      // Prefer the Amadeus portion when available; keep the full payload for debugging
      const data = json.data || null
      if (data?.amadeus_raw) {
        // Use a robust parser to extract common Amadeus fields
        const parsed = parseAmadeusRaw(data.amadeus_raw)
        if (parsed) {
          // also include top-level status if available
          parsed.status = parsed.status || data.status || data.amadeus_raw?.status || parsed.raw?.status
          data.parsedAmadeus = parsed
        }
      }
      setDetails(data)
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  // Normalize display values
  const flightDisplay = () => {
    if (!details) return ''
    const preferred = (carrier && number) ? `${carrier.toUpperCase()} ${number}` : null
    return preferred || (details.parsedAmadeus?.carrier ? `${details.parsedAmadeus.carrier} ${details.parsedAmadeus.flightNumber || ''}` : '') || details.flight || details.callsign || details.flightNumber || ''
  }

  const depDisplay = () => {
    if (!details) return ''
    const dep = details.departure || details.departure_time || details.dep || (details.amadeus_raw && details.amadeus_raw.departure)
    const iata = safeGetIata(dep)
    const at = safeGetTime(dep)
    return { iata, at }
  }

  const arrDisplay = () => {
    if (!details) return ''
    const arr = details.arrival || details.arrival_time || details.arr || (details.amadeus_raw && details.amadeus_raw.arrival)
    const iata = safeGetIata(arr)
    const at = safeGetTime(arr)
    return { iata, at }
  }

  const durationDisplay = () => {
    if (!details) return null
    // Try Amadeus raw itinerary duration
    const am = details.amadeus_raw
    if (am && am.data && Array.isArray(am.data) && am.data[0]?.itineraries) {
      const it = am.data[0].itineraries?.[0]
      if (it && it.duration) return it.duration
    }
    // Fallbacks
    if (details.duration) return details.duration
    if (details.durationMins) return `${Math.floor(details.durationMins/60)}h ${details.durationMins%60}m`
    return null
  }

  return (
    <div className="min-h-screen bg-black flex flex-col pt-24">
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-white mb-6">
            <h1 className="text-2xl font-bold mb-3">Live Flight Status</h1>
            <p className="text-sm text-white/70 mb-4">Enter carrier code, flight number, and scheduled departure date. We use Amadeus On‑Demand Flight Status.</p>

            <form onSubmit={lookupFlight} className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value.toUpperCase())}
                placeholder="AI"
                maxLength={3}
                className="rounded border border-white/30 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 w-24"
                aria-label="IATA carrier code"
              />
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="101"
                inputMode="numeric"
                maxLength={4}
                className="rounded border border-white/30 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 w-28"
                aria-label="Flight number"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded border border-white/30 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
                aria-label="Scheduled departure date"
              />
              <button type="submit" className="rounded bg-white/20 border border-white/30 text-white px-4 py-2 hover:bg-white/30 transition-colors" disabled={loading}>
                {loading ? 'Searching…' : 'Search'}
              </button>
            </form>

            {error && <div className="text-sm text-red-400 mb-3">{error}</div>}
          </div>

          {details && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-white">
              <h3 className="font-semibold mb-4 text-xl">Flight Details</h3>
              <div className="text-sm text-white/80 space-y-2">
                  {/* Prefer parsed Amadeus values when present */}
                  <div><strong>Flight:</strong> {details.parsedAmadeus?.carrier ? `${details.parsedAmadeus.carrier} ${details.parsedAmadeus.flightNumber || ''}` : flightDisplay()}</div>
                  <div><strong>Status:</strong> {details.parsedAmadeus?.status || details.status || 'N/A'}</div>
                  <div>
                    <strong>Departure:</strong>{' '}
                    {details.parsedAmadeus?.departure?.iataCode || details.parsedAmadeus?.raw?.departure?.iataCode || depDisplay().iata || 'N/A'}
                    {details.parsedAmadeus?.departure?.at || details.parsedAmadeus?.raw?.departure?.scheduledTime || depDisplay().at ? ` • ${details.parsedAmadeus?.departure?.at || details.parsedAmadeus?.raw?.departure?.scheduledTime || depDisplay().at}` : ''}
                    {details.parsedAmadeus?.departure?.terminal || details.parsedAmadeus?.raw?.departure?.terminal ? ` • T${details.parsedAmadeus?.departure?.terminal || details.parsedAmadeus?.raw?.departure?.terminal}` : ''}
                  </div>
                  <div>
                    <strong>Arrival:</strong>{' '}
                    {details.parsedAmadeus?.arrival?.iataCode || details.parsedAmadeus?.raw?.arrival?.iataCode || arrDisplay().iata || 'N/A'}
                    {details.parsedAmadeus?.arrival?.at || details.parsedAmadeus?.raw?.arrival?.scheduledTime || arrDisplay().at ? ` • ${details.parsedAmadeus?.arrival?.at || details.parsedAmadeus?.raw?.arrival?.scheduledTime || arrDisplay().at}` : ''}
                    {details.parsedAmadeus?.arrival?.terminal || details.parsedAmadeus?.raw?.arrival?.terminal ? ` • T${details.parsedAmadeus?.arrival?.terminal || details.parsedAmadeus?.raw?.arrival?.terminal}` : ''}
                  </div>
                  <div><strong>Duration:</strong> {details.parsedAmadeus?.duration || durationDisplay() || 'N/A'}</div>
                  <div><strong>Source:</strong> <span className="font-medium">{details.source || 'simulated'}</span></div>
                  {details.amadeus_raw?._endpoint && (
                    <div className="text-xs text-white/60 mt-1">Amadeus endpoint: <span className="font-medium">{details.amadeus_raw._endpoint}</span></div>
                  )}
                  {details.amadeus_raw?._requestUrl && (
                    <div className="text-xs text-white/60 mt-1">Request URL: <a className="underline break-all" href="#" onClick={(e)=>e.preventDefault()}>{details.amadeus_raw._requestUrl}</a></div>
                  )}
                </div>
                <div className="mt-3 text-xs">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} /> Show raw payloads</label>
                </div>
                {showRaw && (
                  <div className="mt-3 text-xs">
                    <h4 className="font-medium">Raw Response</h4>
                    <pre className="overflow-auto max-h-64 p-2 bg-black/60 border border-white/20 text-[11px] text-white">{JSON.stringify(details, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
        </div>
        <Footer />
      </div>
  )
}
