
// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

async function queryDatabase(query, params) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    await connection.end();
  }
}

// Helper to map Amadeus aircraft codes to readable names
const mapAircraftCode = (code) => {
  if (!code) return null
  const c = String(code).toUpperCase()
  const map = {
    '77W': 'Boeing 777-300ER',
    '772': 'Boeing 777-200',
    '788': 'Boeing 787-8',
    '789': 'Boeing 787-9',
    '738': 'Boeing 737-800',
    '73H': 'Boeing 737-8',
    '320': 'Airbus A320',
    '321': 'Airbus A321',
    '32N': 'Airbus A320neo',
    '321N': 'Airbus A321neo',
    '330': 'Airbus A330',
    '350': 'Airbus A350',
    'A388': 'Airbus A380',
    'B737': 'Boeing 737',
  }
  return map[c] || code
}

// Read Amadeus credentials from environment (server-side only)
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_KEY
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_SECRET

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.toUpperCase();
  const to = searchParams.get("to")?.toUpperCase();

  let date = searchParams.get("date") || (() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })()
  // Normalize common dd/mm/yyyy -> YYYY-MM-DD if user provided that format (e.g. 14/10/2025)
  if (typeof date === 'string' && date.includes('/')) {
    const m = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) {
      const dd = m[1].padStart(2, '0')
      const mm = m[2].padStart(2, '0')
      const yyyy = m[3]
      date = `${yyyy}-${mm}-${dd}`
    }
  }
  // Amadeus credentials are defined at module scope above

  // Helper function to get airline name from code
  const getAirlineName = (carrierCode) => {
    const airlines = {
      // Indian Airlines
      '6E': 'IndiGo',
      'AI': 'Air India',
      'SG': 'SpiceJet', 
      'G8': 'GoAir',
      'I5': 'AirAsia India',
      'UK': 'Vistara',
      'IX': 'Air India Express',
      
      // International Airlines
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'KL': 'KLM',
      'TK': 'Turkish Airlines',
      'EY': 'Etihad Airways'
    }
    return airlines[carrierCode] || carrierCode || 'Unknown Airline'
  }

  try {
    // If from/to are not provided, treat this as a "trending" request.
    const isTrending = !from || !to

    // Default date is already set above.
    let cabin = (searchParams.get("class") || "ECONOMY").toUpperCase()
    const pax = searchParams.get("pax") || "1"

    // Guard: ensure Amadeus credentials exist in env
    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
      console.error('Amadeus credentials missing. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in environment.')
      return Response.json({ flights: [], isDemo: false, error: 'Flight search unavailable. Missing server credentials.' }, { status: 500 })
    }

    // 1. Get Amadeus access token with timeout
    const tokenRes = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })
    if (!tokenRes.ok) throw new Error("Amadeus auth failed: " + tokenRes.status)
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Helper to call Amadeus flight-offers for a single route
    const fetchOffersForRoute = async (routeFrom, routeTo) => {
      try {
        const offersUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${routeFrom}&destinationLocationCode=${routeTo}&departureDate=${date}&adults=${pax}&travelClass=${cabin}`
        const offersRes = await fetch(offersUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(20000)
        })
        if (!offersRes.ok) {
          console.warn(`Amadeus offers failed for ${routeFrom}-${routeTo}: ${offersRes.status}`)
          return []
        }
        const offersData = await offersRes.json()
        if (!Array.isArray(offersData.data)) return []
        return offersData.data
      } catch (err) {
        console.warn('Amadeus call failed for route', routeFrom, routeTo, err.message)
        return []
      }
    }

    // 3. Map Amadeus data to frontend format
    let flights = []
    if (isTrending) {
      // Popular route pairs to show as trending (IATA codes)
      const popularRoutes = [
        ['DEL','BOM'], // New Delhi - Mumbai
        ['BOM','BLR'], // Mumbai - Bangalore
        ['DEL','BLR'], // Delhi - Bangalore
        ['BLR','MAA'], // Bangalore - Chennai
        ['BOM','DEL'],
        ['HYD','BLR'],
        ['DEL','HYD']
      ]

      // Fetch offers in parallel but limit concurrency
      const allOffersPromises = popularRoutes.map(([rFrom, rTo]) => fetchOffersForRoute(rFrom, rTo))
      const allOffers = await Promise.all(allOffersPromises)

      // Flatten and map offers to flight objects, pick top offer per route (or first 2)
      allOffers.forEach((offersArray, routeIdx) => {
        const rFrom = popularRoutes[routeIdx][0]
        const rTo = popularRoutes[routeIdx][1]
        if (!Array.isArray(offersArray) || offersArray.length === 0) return
        // take up to 3 offers per route
        offersArray.slice(0,3).forEach((offer, idx) => {
          const seg = offer.itineraries[0]?.segments[0]
          const basePrice = offer.price?.base ? Number(offer.price.base) : 0
          const totalPrice = offer.price?.total ? Number(offer.price.total) : 0
          const fees = totalPrice - basePrice
          const priceInINR = offer.price?.currency === 'INR' ? totalPrice : 
                            offer.price?.currency === 'USD' ? Math.round(totalPrice * 83) :
                            offer.price?.currency === 'EUR' ? Math.round(totalPrice * 90) :
                            totalPrice

          const lastSeg = offer.itineraries[0]?.segments[offer.itineraries[0]?.segments.length - 1]
          const depObj = seg?.departure || seg || {}
          const arrObj = lastSeg?.arrival || lastSeg || {}
          const extractIata = (o, fallbackCode) => o?.iataCode || o?.airportCode || o?.iata || o?.boardPointIataCode || fallbackCode || null
          const extractTime = (o) => {
            if (!o) return null
            if (typeof o === 'string') return o
            if (o.at) return o.at
            if (o.scheduledTime) return o.scheduledTime
            if (o.time) return o.time
            if (Array.isArray(o.timings) && o.timings.length) {
              const std = o.timings.find(t => t.qualifier === 'STD' || t.qualifier === 'ETD' || t.qualifier === 'DEP')
              return (std && std.value) || o.timings[0].value
            }
            return null
          }

          const depIataCode = extractIata(depObj, rFrom)
          const arrIataCode = extractIata(arrObj, rTo)
          const depAtFull = extractTime(depObj)
          const arrAtFull = extractTime(arrObj)
          // calculate duration in minutes from itinerary.duration (PT#H#M) or timestamps
          const itinerary = offer.itineraries && offer.itineraries[0]
          let durationMins = 0
          if (itinerary?.duration) {
            const m = String(itinerary.duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
            if (m) {
              const h = parseInt(m[1] || '0')
              const mm = parseInt(m[2] || '0')
              durationMins = h * 60 + mm
            }
          }
          if (!durationMins && depAtFull && arrAtFull) {
            try {
              const d1 = new Date(depAtFull)
              const d2 = new Date(arrAtFull)
              if (!isNaN(d1) && !isNaN(d2)) {
                durationMins = Math.max(0, Math.round((d2 - d1) / 60000))
              }
            } catch (e) {
              durationMins = 0
            }
          }

          // compute stopovers (layovers) if multiple segments
          const segments = offer.itineraries[0]?.segments || []
          let stopovers = null
          if (segments.length > 1) {
            const stopsArr = []
            for (let si = 0; si < segments.length - 1; si++) {
              const cur = segments[si]
              const next = segments[si + 1]
              const arrTime = cur?.arrival?.at || cur?.arrival || null
              const depTimeNext = next?.departure?.at || next?.departure || null
              let layover = 0
              if (arrTime && depTimeNext) {
                try {
                  const a = new Date(arrTime)
                  const b = new Date(depTimeNext)
                  if (!isNaN(a) && !isNaN(b)) layover = Math.max(0, Math.round((b - a) / 60000))
                } catch (e) {
                  layover = 0
                }
              }
              const airport = cur?.arrival?.iataCode || cur?.arrival?.airportCode || cur?.arrival || null
              stopsArr.push({ airport, duration: layover })
            }
            stopovers = stopsArr.length ? stopsArr : null
          }

          // create simulated comparison pricing: amadeus price + random markup between 700 and 1500 INR
          const randomMarkup = Math.floor(700 + Math.random() * 800)
          const airlineName = getAirlineName(seg?.carrierCode)
          if (!seg?.carrierCode || !airlineName || airlineName === 'Unknown Airline') return
          const comparisons = [
            { provider: airlineName, price: priceInINR },
            { provider: 'X', price: priceInINR + Math.floor(700 + Math.random() * 800) },
            { provider: 'Y', price: priceInINR + Math.floor(700 + Math.random() * 800) },
            { provider: 'Z', price: priceInINR + Math.floor(700 + Math.random() * 800) }
          ]

          // normalize times to HH:MM strings where possible
          const normalizeTimeShort = (t) => {
            if (!t) return ''
            if (typeof t === 'string') return t.slice ? (t.slice(11,16) || t) : String(t)
            if (t.at) return t.at.slice ? t.at.slice(11,16) : String(t.at)
            if (t.value) return t.value.slice ? t.value.slice(11,16) : String(t.value)
            return ''
          }

          flights.push({
            id: offer.id || `amadeus_trending_${routeIdx}_${idx}`,
            airline: getAirlineName(seg?.carrierCode),
            number: seg?.number || "",
            airlineCode: seg?.carrierCode || "",
            logo: "/abstract-airline-logo.png",
            from: depIataCode || rFrom,
            to: arrIataCode || rTo,
            departureTime: normalizeTimeShort(depAtFull),
            arrivalTime: normalizeTimeShort(arrAtFull),
            departureAtFull: depAtFull || null,
            arrivalAtFull: arrAtFull || null,
            departureAirport: depIataCode || null,
            arrivalAirport: arrIataCode || null,
            durationMins: durationMins,
            stops: offer.itineraries[0]?.segments.length - 1 || 0,
            stopovers: stopovers,
            class: cabin.toLowerCase(),
            price: priceInINR,
            comparisons,
            basePrice,
            fees,
            currency: 'INR',
            originalCurrency: offer.price?.currency || 'USD',
            amadeusOfferId: offer.id,
            segments: offer.itineraries[0]?.segments,
            aircraft: seg?.aircraft?.code || 'B737',
            aircraftCode: seg?.aircraft?.code || 'B737',
            aircraftType: mapAircraftCode(seg?.aircraft?.code || 'B737'),
            terminal: seg?.departure?.terminal || null,
            gate: null,
          })
        })
      })

      // Optionally sort by price and limit
      flights = flights.sort((a,b) => a.price - b.price).slice(0, 20)
    } else {
      // Non-trending: use single from/to flow (original behavior)
      const offersData = await fetchOffersForRoute(from, to)
      if (Array.isArray(offersData)) {
  flights = offersData
  .map((offer, idx) => {
          const seg = offer.itineraries[0]?.segments[0]
          const basePrice = offer.price?.base ? Number(offer.price.base) : 0
          const totalPrice = offer.price?.total ? Number(offer.price.total) : 0
          const fees = totalPrice - basePrice
          const priceInINR = offer.price?.currency === 'INR' ? totalPrice : 
                            offer.price?.currency === 'USD' ? Math.round(totalPrice * 83) :
                            offer.price?.currency === 'EUR' ? Math.round(totalPrice * 90) :
                            totalPrice

          const lastSeg = offer.itineraries[0]?.segments[offer.itineraries[0]?.segments.length - 1]
          const depObj = seg?.departure || seg || {}
          const arrObj = lastSeg?.arrival || lastSeg || {}
          const extractIata = (o, fallbackCode) => o?.iataCode || o?.airportCode || o?.iata || o?.boardPointIataCode || fallbackCode || null
          const extractTime = (o) => {
            if (!o) return null
            if (typeof o === 'string') return o
            if (o.at) return o.at
            if (o.scheduledTime) return o.scheduledTime
            if (o.time) return o.time
            if (Array.isArray(o.timings) && o.timings.length) {
              const std = o.timings.find(t => t.qualifier === 'STD' || t.qualifier === 'ETD' || t.qualifier === 'DEP')
              return (std && std.value) || o.timings[0].value
            }
            return null
          }

          const depIataCode = extractIata(depObj, from)
          const arrIataCode = extractIata(arrObj, to)
          const depAtFull = extractTime(depObj)
          const arrAtFull = extractTime(arrObj)

          const airlineName = getAirlineName(seg?.carrierCode)
          if (!seg?.carrierCode || !airlineName || airlineName === 'Unknown Airline') return null
          return {
            id: offer.id || `amadeus_${idx}`,
            airline: getAirlineName(seg?.carrierCode),
            number: seg?.number || "",
            airlineCode: seg?.carrierCode || "",
            logo: "/abstract-airline-logo.png",
            from: depIataCode || from,
            to: arrIataCode || to, // Use final destination
            departureTime: depAtFull ? (depAtFull.slice ? depAtFull.slice(11,16) : depAtFull) : "",
            arrivalTime: arrAtFull ? (arrAtFull.slice ? arrAtFull.slice(11,16) : arrAtFull) : "",
            departureAtFull: depAtFull || null,
            arrivalAtFull: arrAtFull || null,
            departureAirport: depIataCode || null,
            arrivalAirport: arrIataCode || null,
            // compute duration and stopovers for non-trending offers
            durationMins: (() => {
              try {
                const itinerary = offer.itineraries && offer.itineraries[0]
                let dm = 0
                if (itinerary?.duration) {
                  const m = String(itinerary.duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
                  if (m) dm = (parseInt(m[1] || '0') * 60) + (parseInt(m[2] || '0'))
                }
                if (!dm && depAtFull && arrAtFull) {
                  const d1 = new Date(depAtFull)
                  const d2 = new Date(arrAtFull)
                  if (!isNaN(d1) && !isNaN(d2)) dm = Math.max(0, Math.round((d2 - d1) / 60000))
                }
                return dm
              } catch (err) { return 0 }
            })(),
            stops: offer.itineraries[0]?.segments.length - 1 || 0,
            stopovers: (() => {
              try {
                const segs = offer.itineraries[0]?.segments || []
                if (segs.length <= 1) return null
                const stopsArr = []
                for (let si = 0; si < segs.length - 1; si++) {
                  const cur = segs[si]
                  const next = segs[si + 1]
                  const arrTime = cur?.arrival?.at || cur?.arrival || null
                  const depTimeNext = next?.departure?.at || next?.departure || null
                  let layover = 0
                  if (arrTime && depTimeNext) {
                    const a = new Date(arrTime)
                    const b = new Date(depTimeNext)
                    if (!isNaN(a) && !isNaN(b)) layover = Math.max(0, Math.round((b - a) / 60000))
                  }
                  const airport = cur?.arrival?.iataCode || cur?.arrival?.airportCode || cur?.arrival || null
                  stopsArr.push({ airport, duration: layover })
                }
                return stopsArr.length ? stopsArr : null
              } catch (err) { return null }
            })(),
            // simulated comparisons for non-trending offers (primary provider = actual airline)
            comparisons: [
              { provider: airlineName, price: priceInINR },
              { provider: 'X', price: priceInINR + Math.floor(700 + Math.random() * 800) },
              { provider: 'Y', price: priceInINR + Math.floor(700 + Math.random() * 800) },
              { provider: 'Z', price: priceInINR + Math.floor(700 + Math.random() * 800) }
            ],
            class: cabin.toLowerCase(),
            price: priceInINR,
            basePrice,
            fees,
            currency: 'INR',
            originalCurrency: offer.price?.currency || 'USD',
            amadeusOfferId: offer.id,
            segments: offer.itineraries[0]?.segments,
            aircraft: seg?.aircraft?.code || 'B737',
            aircraftCode: seg?.aircraft?.code || 'B737',
            aircraftType: mapAircraftCode(seg?.aircraft?.code || 'B737'),
            terminal: seg?.departure?.terminal || null,
            gate: null,
          }
        }).filter(Boolean)
      }
    }
    
    return Response.json({ flights, isDemo: false })
  } catch (e) {
    // Log the API error with more detail
    console.error("Flight API error:", {
      message: e.message,
      cause: e.cause?.code || 'Unknown',
      route: `${from} to ${to}`,
      date: date
    })
    
    // Return appropriate error message based on error type
    let errorMessage = "Unable to fetch flights at the moment. Please try again later."
    
    if (e.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = "Flight search is taking longer than usual. Please try again in a moment."
    } else if (e.message.includes('auth failed')) {
      errorMessage = "Flight booking service is temporarily unavailable. Please try again later."
    } else if (e.message.includes('offers failed')) {
      errorMessage = "No flights found for this route. Please try different dates or destinations."
    }
    
    return Response.json({ 
      flights: [], 
      isDemo: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    })
  }
}

