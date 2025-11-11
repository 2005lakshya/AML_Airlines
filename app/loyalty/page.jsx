"use client"

import { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import Footer from "@/components/footer"
import LoyaltyStats from "@/components/loyalty-stats"
import RequireAuth from "@/components/require-auth"
import { useAuth } from "@/contexts/auth-context"

// Mock data for loyalty program
const tierBenefits = {
  Bronze: {
    color: "bg-amber-600",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    pointsRequired: 0,
    nextTier: "Silver",
    nextTierPoints: 2000,
    benefits: ["Earn 1 point per ₹100", "Basic customer support", "Standard booking"]
  },
  Silver: {
    color: "bg-gray-400",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    pointsRequired: 2000,
    nextTier: "Gold",
    nextTierPoints: 5000,
    benefits: ["Earn 1.5 points per ₹100", "Priority boarding", "Free seat selection", "24/7 support"]
  },
  Gold: {
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    pointsRequired: 5000,
    nextTier: "Platinum",
    nextTierPoints: 10000,
    benefits: ["Earn 2 points per ₹100", "Priority check-in", "Free baggage upgrade", "Lounge access", "Premium support"]
  },
  Platinum: {
    color: "bg-purple-600",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    pointsRequired: 10000,
    nextTier: null,
    nextTierPoints: null,
    benefits: ["Earn 3 points per ₹100", "Complimentary upgrades", "VIP lounge access", "Dedicated concierge", "Flexible booking"]
  }
}

const rewardsCatalog = [
  { id: 1, name: "Free Domestic Flight", points: 2500, category: "flights", description: "Redeem for any domestic flight up to ₹8,000" },
  { id: 2, name: "Airport Lounge Access", points: 500, category: "services", description: "One-time access to premium airport lounge" },
  { id: 3, name: "Seat Upgrade", points: 800, category: "upgrades", description: "Upgrade to premium economy or business class" },
  { id: 4, name: "Extra Baggage", points: 300, category: "services", description: "Additional 10kg baggage allowance" },
  { id: 5, name: "Fast Track Security", points: 200, category: "services", description: "Skip regular security lines" },
  { id: 6, name: "Free Meal Upgrade", points: 150, category: "services", description: "Upgrade to premium meal selection" },
  { id: 7, name: "International Flight Discount", points: 1500, category: "discounts", description: "₹5,000 off on international bookings" },
  { id: 8, name: "Hotel Voucher", points: 1000, category: "partners", description: "₹3,000 hotel booking credit" }
]

function LoyaltyInner() {
  const { user } = useAuth()
  const [qrProcessing, setQrProcessing] = useState(false)
  const [parsedTicket, setParsedTicket] = useState(null)
  const [bookingAmount, setBookingAmount] = useState(0)
  const [flightStatus, setFlightStatus] = useState("on-time")
  const [calculatedPoints, setCalculatedPoints] = useState(null)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualPNR, setManualPNR] = useState("")
  const [fetchingBooking, setFetchingBooking] = useState(false)
  const [points, setPoints] = useState(0) // Start from 0 in UI until loaded from DB
  const [tier, setTier] = useState("Bronze")
  const [earned, setEarned] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [pointsHistory, setPointsHistory] = useState([]) // show DB-only
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [redeeming, setRedeeming] = useState(false)

  const controls = useAnimation()

  // Determine current tier info
  const currentTierInfo = tierBenefits[tier]
  const progressToNext = currentTierInfo.nextTier 
    ? ((points - currentTierInfo.pointsRequired) / (currentTierInfo.nextTierPoints - currentTierInfo.pointsRequired)) * 100
    : 100

  useEffect(() => {
    // Update tier based on points
    if (points >= 10000) setTier("Platinum")
    else if (points >= 5000) setTier("Gold")
    else if (points >= 2000) setTier("Silver")
    else setTier("Bronze")
  }, [points])

  useEffect(() => {
    if (user?.id) {
      setLoadingHistory(true)
      const url = `/api/loyalty-transactions?userId=${encodeURIComponent(user.id)}`
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data?.success) {
            setPoints(typeof data.points === 'number' ? data.points : 0)
            // Map DB transactions to UI shape if needed
            const tx = Array.isArray(data.transactions) ? data.transactions.map((t) => ({
              id: t.TransactionID || t.transactionid || `${t.TransactionDate}-${t.TransactionType}`,
              date: (t.TransactionDate || t.transactiondate || new Date()).toString().slice(0, 10),
              activity: t.TransactionType === 'BOOKING_EARNED'
                ? `Flight ${t.Origin || t.origin || ''} → ${t.Destination || t.destination || ''}${t.PNR ? ` (${t.PNR})` : ''}`
                : (t.TransactionType || 'Activity'),
              points: t.PointsEarned || t.pointsearned || 0,
              type: (t.TransactionType || '').toLowerCase().includes('redeem') ? 'redeemed' : 'earned',
            })) : []
            setPointsHistory(tx)
          }
        })
        .catch((err) => console.error('Failed to fetch loyalty transactions:', err))
        .finally(() => setLoadingHistory(false))
    }
  }, [user?.id])

  async function recordTransaction(activity, points, type) {
    if (!user?.id) return;

    const transaction = {
      userId: user.id,
      activity,
      points,
      transactionDate: new Date().toISOString(),
      type,
    };

    try {
      const response = await fetch('/api/loyalty-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });
      const data = await response.json();
      if (data.success) {
        setPointsHistory((prev) => [...prev, transaction]);
        alert("Transaction recorded successfully!");
      } else {
        console.error("Failed to record transaction:", data.error);
      }
    } catch (error) {
      console.error("Error recording transaction:", error);
    }
  }

  async function fetchBookingByPNR(pnr) {
    if (!pnr || pnr.length < 5) {
      alert('Please enter a valid PNR (at least 5 characters)')
      return
    }

    setFetchingBooking(true)
    setParsedTicket(null)
    setCalculatedPoints(null)

    try {
      // First, try to fetch from localStorage bookings
      const bookings = JSON.parse(localStorage.getItem('userBookings') || '[]')
      const booking = bookings.find(b => b.pnr?.toUpperCase() === pnr.toUpperCase())

      if (booking) {
        // Found booking in local storage
        const ticket = {
          passengerName: booking.passengers?.[0] ? 
            `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` : 
            user?.name || 'Unknown',
          origin: booking.flight?.from || 'Unknown',
          destination: booking.flight?.to || 'Unknown',
          flightNumber: booking.flight?.number || 'Unknown',
          date: booking.flight?.date || new Date().toISOString().split('T')[0],
          bookingRef: booking.pnr,
          airline: booking.flight?.airline || 'Unknown'
        }
        
        setParsedTicket(ticket)
        // Calculate amount from booking
        const totalAmount = booking.costs?.total || booking.flight?.price || 0
        setBookingAmount(totalAmount)
        setFlightStatus('on-time') // Default to on-time
        setManualEntry(false)
        setManualPNR("")
        setFetchingBooking(false)
        return
      }

      // Try API fallback
      const response = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.booking) {
          const booking = data.booking
          const ticket = {
            passengerName: booking.passengerName || user?.name || 'Unknown',
            origin: booking.origin || 'Unknown',
            destination: booking.destination || 'Unknown',
            flightNumber: booking.flightNumber || 'Unknown',
            date: booking.date || new Date().toISOString().split('T')[0],
            bookingRef: pnr,
            airline: booking.airline || 'Unknown'
          }
          setParsedTicket(ticket)
          setBookingAmount(booking.amount || 0)
          setFlightStatus(booking.status || 'on-time')
          setManualEntry(false)
          setManualPNR("")
          setFetchingBooking(false)
          return
        }
      }

      // If not found, try Amadeus PNR API
      const amadeusRes = await fetch('/api/amadeus/pnr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr })
      })
      const amadeusData = await amadeusRes.json()
      if (amadeusRes.ok && amadeusData.success && amadeusData.data) {
        // Parse Amadeus response
        const order = amadeusData.data.data
        // Find first passenger and first flight segment
        const passenger = order?.travelers?.[0]?.name?.firstName ? `${order.travelers[0].name.firstName} ${order.travelers[0].name.lastName}` : user?.name || 'Unknown'
        const segment = order?.flightOffers?.[0]?.itineraries?.[0]?.segments?.[0]
        const ticket = {
          passengerName: passenger,
          origin: segment?.departure?.iataCode || 'Unknown',
          destination: segment?.arrival?.iataCode || 'Unknown',
          flightNumber: segment?.carrierCode && segment?.number ? `${segment.carrierCode}${segment.number}` : 'Unknown',
          date: segment?.departure?.at ? segment.departure.at.split('T')[0] : new Date().toISOString().split('T')[0],
          bookingRef: pnr,
          airline: segment?.carrierCode || 'Unknown'
        }
        setParsedTicket(ticket)
        setBookingAmount(order?.flightOffers?.[0]?.price?.grandTotal ? Number(order.flightOffers[0].price.grandTotal) : 0)
        setFlightStatus('on-time')
        setManualEntry(false)
        setManualPNR("")
      } else {
        alert('Booking not found in local, DB, or Amadeus. Please check your PNR.')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      alert('Failed to fetch booking. Please try manual entry.')
    } finally {
      setFetchingBooking(false)
    }
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if it's an image
    if (file.type.startsWith('image/')) {
      scanQrFromImage(file)
    } else {
      alert('Please upload an image file (PNG, JPG, JPEG)')
    }
  }

  async function scanQrFromImage(file) {
    setQrProcessing(true)
    setParsedTicket(null)
    setCalculatedPoints(null)

    try {
      // Read file into image
      const imgDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Create an offscreen image & canvas
      const img = document.createElement('img')
      img.src = imgDataUrl
      await img.decode()

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // Get image data and run jsQR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Try to import jsQR - if it fails, offer manual entry
      let code = null
      try {
        const jsqr = await import('jsqr')
        code = jsqr.default(imageData.data, imageData.width, imageData.height)
      } catch (importError) {
        console.error('jsQR not available:', importError)
        alert('QR scanner not available. Please enter your PNR manually.')
        setManualEntry(true)
        setQrProcessing(false)
        return
      }

      if (!code) {
        // No QR detected - offer manual entry
        const retry = confirm('No QR code detected in the image. Would you like to enter your PNR manually?')
        if (retry) {
          setManualEntry(true)
        }
        setQrProcessing(false)
        return
      }

      // Parse QR payload
      const payload = code.data
      console.log('QR payload:', payload)

      // Check if it's a PNR directly
      const pnrPattern = /\b([A-Z0-9]{5,6})\b/
      const pnrMatch = payload.match(pnrPattern)
      
      if (pnrMatch) {
        // Found a PNR - try to fetch booking details
        await fetchBookingByPNR(pnrMatch[0])
      } else {
        // Try to parse as structured data
        let parsed = {}
        try {
          parsed = JSON.parse(payload)
        } catch (e) {
          // Try simple key=value parsing
          const pairs = payload.split(/[|;,]/)
          pairs.forEach(p => {
            const [k, v] = p.split(/[:=]/)
            if (k && v) parsed[k.trim().toLowerCase()] = v.trim()
          })
        }

        // Extract PNR from parsed data
        const extractedPNR = parsed.pnr || parsed.ref || parsed.booking || parsed.bookingref || null
        
        if (extractedPNR) {
          await fetchBookingByPNR(extractedPNR)
        } else {
          alert('Could not extract booking reference from QR code. Please enter your PNR manually.')
          setManualEntry(true)
        }
      }

    } catch (err) {
      console.error('QR scan error:', err)
      alert('Failed to process QR code. Please try entering your PNR manually.')
      setManualEntry(true)
    } finally {
      setQrProcessing(false)
    }
  }

  function computePoints({ amount = 0, status = 'on-time', tierName = tier }) {
    // Base earn rate by tier
    const tierMultiplier = {
      Bronze: 1,
      Silver: 1.25,
      Gold: 1.5,
      Platinum: 2
    }[tierName] || 1

    // Base points = floor(amount / 100) * baseRate
    const baseRate = 1 // 1 point per ₹100 base
    let basePoints = Math.floor(amount / 100) * baseRate

    // Status adjustments
    // on-time: +0%, delayed: +10% (compensation), cancelled: +50% (compensation/voucher)
    const statusMultiplier = status === 'delayed' ? 1.1 : status === 'cancelled' ? 1.5 : 1

    const points = Math.round(basePoints * tierMultiplier * statusMultiplier)
    return points
  }

  function applyCalculatedPoints() {
    if (!calculatedPoints || !parsedTicket) return
    setPoints(p => p + calculatedPoints)
    const activity = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      activity: `Ticket: ${parsedTicket.origin || 'UNK'} → ${parsedTicket.destination || 'UNK'} ${parsedTicket.flightNumber ? '('+parsedTicket.flightNumber+')' : ''}`,
      points: calculatedPoints,
      type: 'earned'
    }
    setPointsHistory(prev => [activity, ...prev])
    setEarned(calculatedPoints)
    setParsedTicket(null)
    setCalculatedPoints(null)
    setBookingAmount(0)
    setFlightStatus('on-time')
  }

  async function redeemReward(reward) {
    if (!user?.id) return alert('Please sign in to redeem')
    if (points < reward.points) return alert('Insufficient points for this reward.')
    try {
      setRedeeming(true)
      const res = await fetch('/api/loyalty-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeem', userId: user.id, points: reward.points, rewardName: reward.name })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Redeem failed')
      // Update UI with new points and add a record (will also reload next GET)
      setPoints(data.newPoints ?? Math.max(0, points - reward.points))
      setPointsHistory(prev => [{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        activity: `Redeemed: ${reward.name}`,
        points: -reward.points,
        type: 'redeemed'
      }, ...prev])
      alert(`Redeemed ${reward.name}! Your code: ${data.code}`)
    } catch (e) {
      console.error(e)
      alert(e.message)
    } finally {
      setRedeeming(false)
    }
  }

  const filteredRewards = selectedCategory === "all" 
    ? rewardsCatalog 
    : rewardsCatalog.filter(r => r.category === selectedCategory)

  return (
    <div className="min-h-screen bg-black pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            SkyMiles Loyalty Program
          </h1>
          <p className="text-white/80 text-lg">Earn points, unlock rewards, and enjoy exclusive benefits</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Stats Card */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{points.toLocaleString()} Points</h2>
                  <p className="text-white/70">Available for redemption</p>
                </div>
                <div className={`${currentTierInfo.color} text-white px-4 py-2 rounded-full font-semibold`}>
                  {tier} Member
                </div>
              </div>

              {/* Tier Progress */}
              {currentTierInfo.nextTier && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-white">Progress to {currentTierInfo.nextTier}</span>
                    <span className="text-sm text-white/70">
                      {points} / {currentTierInfo.nextTierPoints} points
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <motion.div
                      className={`h-3 rounded-full ${currentTierInfo.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {currentTierInfo.nextTierPoints - points} points to {currentTierInfo.nextTier}
                  </p>
                </div>
              )}

              {/* Tier Benefits */}
              <div>
                <h3 className="font-semibold mb-3 text-white">Your {tier} Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentTierInfo.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-white/90">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Boarding Pass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 text-white">Earn More Points</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Add Your Flight</label>
                
                {/* Tab selection */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setManualEntry(false)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      !manualEntry 
                        ? "bg-white/30 text-white border border-white/40" 
                        : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
                    }`}
                  >
                    Upload QR
                  </button>
                  <button
                    onClick={() => setManualEntry(true)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      manualEntry 
                        ? "bg-white/30 text-white border border-white/40" 
                        : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
                    }`}
                  >
                    Enter PNR
                  </button>
                </div>

                {/* QR Upload or Manual Entry */}
                {!manualEntry ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="block w-full cursor-pointer rounded-lg border border-white/30 bg-white/10 text-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-white/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/30"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Upload a boarding pass with QR code or barcode
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualPNR}
                      onChange={(e) => setManualPNR(e.target.value.toUpperCase())}
                      placeholder="Enter PNR (e.g., ABC123)"
                      className="flex-1 rounded-lg border border-white/30 bg-white/10 text-white px-3 py-2 text-sm placeholder:text-white/40"
                      maxLength={6}
                    />
                    <button
                      onClick={() => fetchBookingByPNR(manualPNR)}
                      disabled={fetchingBooking || manualPNR.length < 5}
                      className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed hover:bg-white/30 border border-white/30"
                    >
                      {fetchingBooking ? 'Searching...' : 'Fetch'}
                    </button>
                  </div>
                )}

                {earned > 0 && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-green-400 font-medium"
                  >
                    +{earned} points earned! ✈️
                  </motion.p>
                )}

                {/* Processing indicator */}
                {(qrProcessing || fetchingBooking) && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{qrProcessing ? 'Processing QR code...' : 'Fetching booking...'}</span>
                  </div>
                )}

                {/* Parsed ticket display */}
                {parsedTicket && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 border border-green-400/30 rounded-lg bg-green-500/20 backdrop-blur"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-green-300">Flight Found!</h4>
                        <p className="text-sm text-green-200">{parsedTicket.airline || 'Airline'}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                        {parsedTicket.bookingRef}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <div className="text-xs text-green-300 font-medium">Passenger</div>
                        <div className="text-white">{parsedTicket.passengerName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-300 font-medium">Flight</div>
                        <div className="text-white">{parsedTicket.flightNumber}</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-300 font-medium">Route</div>
                        <div className="text-white">{parsedTicket.origin} → {parsedTicket.destination}</div>
                      </div>
                      <div>
                        <div className="text-xs text-green-300 font-medium">Date</div>
                        <div className="text-white">{parsedTicket.date}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="text-xs text-green-300 font-medium">Amount Paid (₹)</label>
                        <input 
                          type="number" 
                          value={bookingAmount} 
                          onChange={(e) => setBookingAmount(Number(e.target.value))} 
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm mt-1" 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 font-medium">Flight Status</label>
                        <select 
                          value={flightStatus} 
                          onChange={(e) => setFlightStatus(e.target.value)} 
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm mt-1"
                        >
                          <option value="on-time">On Time</option>
                          <option value="delayed">Delayed (+10% bonus)</option>
                          <option value="cancelled">Cancelled (+50% bonus)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={() => setCalculatedPoints(computePoints({ amount: bookingAmount, status: flightStatus, tierName: tier }))} 
                      className="w-full rounded-md bg-green-500 text-white px-4 py-2 font-medium hover:bg-green-600 transition-colors"
                    >
                      Calculate Points
                    </button>

                    {calculatedPoints !== null && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-white/20 border border-white/30 rounded-md backdrop-blur"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-2xl font-bold text-white">{calculatedPoints} Points</div>
                            <div className="text-xs text-white/80">
                              Base: ₹{bookingAmount} × {tier} tier × {flightStatus === 'on-time' ? '1x' : flightStatus === 'delayed' ? '1.1x' : '1.5x'} status
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={applyCalculatedPoints} 
                              className="rounded-md bg-green-500 text-white px-4 py-2 text-sm font-medium hover:bg-green-600"
                            >
                              Add Points
                            </button>
                            <button 
                              onClick={() => { 
                                setParsedTicket(null); 
                                setCalculatedPoints(null); 
                                setBookingAmount(0); 
                                setFlightStatus('on-time');
                                setManualPNR("");
                              }} 
                              className="rounded-md border border-white/40 text-white px-4 py-2 text-sm font-medium hover:bg-white/10"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
              
              <div className="border-t border-white/20 pt-4">
                <h4 className="font-medium mb-2 text-white">Other Ways to Earn</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  <li>• Book flights: 1-3 pts per ₹100</li>
                  <li>• Hotel bookings: 2 pts per ₹100</li>
                  <li>• Refer friends: 500 bonus pts</li>
                  <li>• Write reviews: 50 pts each</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Rewards Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-xl font-bold mb-4 sm:mb-0 text-white">Rewards Catalog</h2>
                <div className="flex gap-2 flex-wrap">
                  {["all", "flights", "services", "upgrades", "discounts", "partners"].map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-white/30 text-white border border-white/40"
                          : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRewards.map(reward => (
                  <motion.div
                    key={reward.id}
                    whileHover={{ scale: 1.02 }}
                    className="border border-white/20 bg-white/5 rounded-lg p-4 hover:shadow-md hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{reward.name}</h3>
                      <span className="text-green-400 font-bold">{reward.points.toLocaleString()} pts</span>
                    </div>
                    <p className="text-sm text-white/70 mb-3">{reward.description}</p>
                    <button
                      onClick={() => redeemReward(reward)}
                      disabled={redeeming || points < reward.points}
                      className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        points >= reward.points && !redeeming
                          ? "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                          : "bg-white/5 text-white/40 cursor-not-allowed border border-white/10"
                      }`}
                    >
                      {redeeming ? 'Redeeming...' : (points >= reward.points ? "Redeem" : "Insufficient Points")}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Points History */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loadingHistory && (
                <div className="text-sm text-white/70">Loading...</div>
              )}
              {!loadingHistory && pointsHistory.length === 0 && (
                <div className="text-sm text-white/60">No activity yet.</div>
              )}
              {!loadingHistory && pointsHistory.map(activity => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-white/20 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.activity}</p>
                    <p className="text-xs text-white/60">{activity.date}</p>
                  </div>
                  <div className={`text-sm font-semibold ${
                    activity.type === "earned" || activity.type === "bonus" 
                      ? "text-green-400" 
                      : "text-red-400"
                  }`}>
                    {activity.points > 0 ? "+" : ""}{activity.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 text-white">
          <h2 className="text-xl font-bold mb-6 text-white">Membership Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(tierBenefits).map(([tierName, tierInfo]) => (
              <motion.div
                key={tierName}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier === tierName 
                    ? `border-white/40 bg-white/10 shadow-md` 
                    : "border-white/20 hover:border-white/30 bg-white/5"
                }`}
              >
                <div className="text-center mb-3">
                  <div className={`${tierInfo.color} text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <span className="font-bold text-lg">{tierName.charAt(0)}</span>
                  </div>
                  <h3 className="font-bold text-white">{tierName}</h3>
                  <p className="text-xs text-white/60">
                    {tierInfo.pointsRequired.toLocaleString()}+ points
                  </p>
                </div>
                <ul className="space-y-1">
                  {tierInfo.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="text-xs flex items-center gap-1 text-white/80">
                      <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                  {tierInfo.benefits.length > 3 && (
                    <li className="text-xs text-white/50">
                      +{tierInfo.benefits.length - 3} more benefits
                    </li>
                  )}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
  )
}

export default function LoyaltyPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-black flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center px-6 py-12">
          <LoyaltyInner />
        </div>
        <Footer />
      </div>
    </RequireAuth>
  )
}
