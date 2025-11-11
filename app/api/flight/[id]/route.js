// Use environment variables for Amadeus credentials (server-side)

export async function GET(request, { params }) {
  const flightId = params.id
  
  // Amadeus credentials
  const amadeusClientId = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_KEY
  const amadeusClientSecret = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_SECRET

  if (!amadeusClientId || !amadeusClientSecret) {
    return Response.json({ flight: null, error: 'Flight details unavailable. Missing server credentials.' }, { status: 500 })
  }

  try {
    // First, try to get the flight from recent search results stored in local storage
    // If not available, we'll need to make a fresh API call
    
    // For now, we'll get the access token and try to fetch flight details
    const tokenRes = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${amadeusClientId}&client_secret=${amadeusClientSecret}`,
      signal: AbortSignal.timeout(15000)
    })
    
    if (!tokenRes.ok) throw new Error("Amadeus auth failed")
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Try to get flight pricing for the specific offer ID
    try {
      const pricingUrl = `https://test.api.amadeus.com/v1/shopping/flight-offers/pricing`
      const pricingRes = await fetch(pricingUrl, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [{ id: flightId }]
          }
        }),
        signal: AbortSignal.timeout(20000)
      })

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json()
        const offer = pricingData.data?.flightOffers?.[0]
        
        if (offer) {
          const seg = offer.itineraries[0]?.segments[0]
          const lastSeg = offer.itineraries[0]?.segments[offer.itineraries[0]?.segments.length - 1]
          
          // Calculate duration
          const calculateDuration = () => {
            const itinerary = offer.itineraries[0]
            if (itinerary?.duration) {
              const duration = itinerary.duration
              const hours = duration.match(/(\d+)H/) ? parseInt(duration.match(/(\d+)H/)[1]) : 0
              const minutes = duration.match(/(\d+)M/) ? parseInt(duration.match(/(\d+)M/)[1]) : 0
              return hours * 60 + minutes
            }
            return 0
          }

          // Convert price to INR
          const totalPrice = offer.price?.total ? Number(offer.price.total) : 0
          const priceInINR = offer.price?.currency === 'INR' ? totalPrice : 
                            offer.price?.currency === 'USD' ? Math.round(totalPrice * 83) :
                            offer.price?.currency === 'EUR' ? Math.round(totalPrice * 90) :
                            totalPrice

          const flight = {
            id: offer.id,
            airline: seg?.carrierCode || "Unknown",
            number: seg?.number || "",
            airlineCode: seg?.carrierCode || "",
            from: seg?.departure?.iataCode || "",
            to: lastSeg?.arrival?.iataCode || "",
            departureTime: seg?.departure?.at ? seg.departure.at.slice(11,16) : "",
            arrivalTime: lastSeg?.arrival?.at ? lastSeg.arrival.at.slice(11,16) : "",
            durationMins: calculateDuration(),
            stops: offer.itineraries[0]?.segments.length - 1 || 0,
            price: priceInINR,
            aircraft: seg?.aircraft?.code || 'B737',
            terminal: seg?.departure?.terminal || 'T2',
            gate: 'A12', // Gates are usually assigned closer to departure
            segments: offer.itineraries[0]?.segments,
            currency: 'INR',
            originalCurrency: offer.price?.currency || 'USD'
          }

          return Response.json({ flight })
        }
      }
    } catch (pricingError) {
      console.error("Flight pricing error:", pricingError.message)
    }

    // If we can't fetch from Amadeus, return an error
    return Response.json({ 
      flight: null, 
      error: "Flight details not found. Please search for flights again." 
    })

  } catch (error) {
    console.error("Flight details API error:", error.message)
    
    return Response.json({ 
      flight: null, 
      error: "Unable to fetch flight details. Please try again later." 
    })
  }
}
