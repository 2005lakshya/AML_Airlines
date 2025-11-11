"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/footer"
import BookingStepper from "@/components/booking-stepper"
import SeatMap from "@/components/seat-map"
import { queryDatabase } from "@/lib/auth-utils"
import { useAuth } from "@/contexts/auth-context"

// Helper function to get airline code from airline name
const getAirlineCode = (airline) => {
  if (!airline) return 'FL'
  
  // Extract airline code from parentheses format: "Emirates (EK)" -> "EK"
  const codeMatch = airline?.match(/\(([^)]+)\)/)
  if (codeMatch) return codeMatch[1]
  
  // Match known airline names to their codes
  const airlineLower = airline.toLowerCase()
  if (airlineLower.includes('emirates')) return 'EK'
  if (airlineLower.includes('indigo')) return '6E'
  if (airlineLower.includes('air india') && !airlineLower.includes('express')) return 'AI'
  if (airlineLower.includes('air india express')) return 'IX'
  if (airlineLower.includes('spicejet')) return 'SG'
  if (airlineLower.includes('goair') || airlineLower.includes('go air')) return 'G8'
  if (airlineLower.includes('airasia')) return 'I5'
  if (airlineLower.includes('vistara')) return 'UK'
  if (airlineLower.includes('qatar')) return 'QR'
  if (airlineLower.includes('british airways')) return 'BA'
  if (airlineLower.includes('lufthansa')) return 'LH'
  if (airlineLower.includes('air france')) return 'AF'
  if (airlineLower.includes('klm')) return 'KL'
  if (airlineLower.includes('turkish')) return 'TK'
  if (airlineLower.includes('etihad')) return 'EY'
  if (airlineLower.includes('saudi')) return 'SV'
  if (airlineLower.includes('thai airways')) return 'TG'
  if (airlineLower.includes('singapore')) return 'SQ'
  if (airlineLower.includes('cathay')) return 'CX'
  if (airlineLower.includes('american airlines')) return 'AA'
  if (airlineLower.includes('delta')) return 'DL'
  if (airlineLower.includes('united airlines')) return 'UA'
  if (airlineLower.includes('uzbekistan')) return 'HY'
  if (airlineLower.includes('srilankan')) return 'UL'
  if (airlineLower.includes('fly dubai') || airlineLower.includes('flydubai')) return 'FZ'
  if (airlineLower.includes('gulf air')) return 'GF'
  if (airlineLower.includes('kuwait')) return 'KU'
  if (airlineLower.includes('ethiopian')) return 'ET'
  if (airlineLower.includes('oman air')) return 'WY'
  if (airlineLower.includes('air canada')) return 'AC'
  if (airlineLower.includes('egyptair') || airlineLower.includes('egypt air')) return 'MS'
  if (airlineLower.includes('finnair')) return 'AY'
  if (airlineLower.includes('iberia')) return 'IB'
  if (airlineLower.includes('lot polish') || airlineLower.includes('polish airlines')) return 'LO'
  if (airlineLower.includes('swiss')) return 'LX'
  
  // Fallback to first 2 characters uppercase
  return airline.substring(0, 2).toUpperCase()
}

// Helper function to get airline color based on airline code or name
const getAirlineColor = (airline) => {
  if (!airline) return '#0ea5e9' // Default sky blue
  
  const airlineCode = getAirlineCode(airline)
  
  const colors = {
    // Indian Airlines
    '6E': '#0ea5e9', // IndiGo - Sky Blue
    'AI': '#f97316', // Air India - Orange
    'SG': '#ef4444', // SpiceJet - Red
    'G8': '#22c55e', // GoAir - Green
    'I5': '#a855f7', // AirAsia India - Purple
    'UK': '#ec4899', // Vistara - Pink
    'IX': '#ca8a04', // Air India Express - Yellow
    
    // International Airlines - Middle East
    'EK': '#dc2626', // Emirates - Red
    'QR': '#7c3aed', // Qatar Airways - Purple
    'EY': '#d97706', // Etihad Airways - Amber
    'FZ': '#ef4444', // Fly Dubai - Red
    'GF': '#d97706', // Gulf Air - Gold
    'KU': '#2563eb', // Kuwait Airways - Blue
    'SV': '#16a34a', // Saudi Arabian Airlines - Green
    'WY': '#a855f7', // Oman Air - Purple/Magenta
    
    // International Airlines - Europe
    'BA': '#1e3a8a', // British Airways - Dark Blue
    'LH': '#eab308', // Lufthansa - Yellow
    'AF': '#2563eb', // Air France - Blue
    'KL': '#0891b2', // KLM - Cyan
    'TK': '#b91c1c', // Turkish Airlines - Dark Red
    'AY': '#1d4ed8', // Finnair - Blue
    'IB': '#dc2626', // Iberia - Red
    'LO': '#2563eb', // LOT Polish Airlines - Blue
    'LX': '#dc2626', // Swiss International Air Lines - Red
    
    // International Airlines - Asia Pacific
    'TG': '#9333ea', // Thai Airways - Purple
    'SQ': '#1d4ed8', // Singapore Airlines - Blue
    'CX': '#059669', // Cathay Pacific - Emerald
    'UL': '#0891b2', // SriLankan Airlines - Blue
    
    // International Airlines - Africa & Others
    'ET': '#16a34a', // Ethiopian Airlines - Green
    'HY': '#2563eb', // Uzbekistan Airways - Blue
    'MS': '#1d4ed8', // EgyptAir - Blue
    
    // International Airlines - Americas
    'AA': '#991b1b', // American Airlines - Dark Red
    'DL': '#1e3a8a', // Delta Air Lines - Dark Blue
    'UA': '#2563eb', // United Airlines - Blue
    'AC': '#dc2626', // Air Canada - Red
  }
  
  console.log('Airline:', airline, 'Code:', airlineCode, 'Color:', colors[airlineCode] || '#0ea5e9')
  return colors[airlineCode] || '#0ea5e9' // Default sky blue
}

// Helper function to format price in Indian Rupees
const formatPriceINR = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (timeString) => {
  if (!timeString) return "--:--"
  
  const [hours, minutes] = timeString.split(':')
  const hour24 = parseInt(hours)
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  
  return `${hour12}:${minutes} ${ampm}`
}

export default function BookingPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [step, setStep] = useState(0)
  const [flight, setFlight] = useState(null)
  const [passengerCount, setPassengerCount] = useState(1)
  const [seatUpgradeCost, setSeatUpgradeCost] = useState(0)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [userFrequentFlyerNumber, setUserFrequentFlyerNumber] = useState("")
  const [userProfileData, setUserProfileData] = useState(null)
  const [isBooking, setIsBooking] = useState(false) // Add loading state
  const [extraServices, setExtraServices] = useState({
    meals: [],
    extraLuggage: 0,
    priorityBoarding: false
  })
  
  // Form now holds array of passengers + contact info
  const [passengers, setPassengers] = useState([])
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: ""
  })
  const [paymentMethod, setPaymentMethod] = useState("Card")

  // Fetch user's Frequent Flyer Number and profile data if logged in
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.user) {
            const u = data.user
            const ffn = u.FrequentFlyerNumber || u.frequentFlyerNumber || ""
            setUserFrequentFlyerNumber(ffn)
            
            // Format date of birth to YYYY-MM-DD for date input
            let formattedDOB = ""
            const dob = u.DateOfBirth || u.dateOfBirth
            if (dob) {
              try {
                const date = new Date(dob)
                if (!isNaN(date.getTime())) {
                  formattedDOB = date.toISOString().split('T')[0]
                }
              } catch (e) {
                console.error("Error parsing date:", e)
              }
            }
            
            // Store full profile data
            setUserProfileData({
              firstName: u.FirstName || u.firstName || "",
              lastName: u.LastName || u.lastName || "",
              dateOfBirth: formattedDOB,
              gender: u.Gender || u.gender || "Male",
              phone: u.PhoneNumber || u.phoneNumber || "",
              email: u.Email || u.email || user.email,
              idType: u.DocumentType || u.documentType || "Passport",
              idNumber: u.DocumentNumber || u.documentNumber || "",
              frequentFlyerNumber: ffn
            })
            
            // Auto-fill contact info
            setContactInfo({
              email: u.Email || u.email || user.email,
              phone: u.PhoneNumber || u.phoneNumber || ""
            })
          }
        })
        .catch((err) => console.error("Failed to fetch user profile:", err))
    }
  }, [isAuthenticated, user?.email])

  // Get flight data from localStorage
  useEffect(() => {
    const bookingFlight = localStorage.getItem('bookingFlight')
    if (bookingFlight) {
      try {
        const flightData = JSON.parse(bookingFlight)
        setFlight(flightData)
      } catch (e) {
        console.error('Failed to parse booking flight data:', e)
      }
    }
    
    // Get passenger count from URL or default to 1
    const urlParams = new URLSearchParams(window.location.search)
    const pax = parseInt(urlParams.get('pax')) || 1
    setPassengerCount(pax)
    
    // Initialize passengers array
    setPassengers(Array(pax).fill(null).map(() => ({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "Male",
      idType: "Passport",
      idNumber: "",
      wheelchairAssistance: false,
      frequentFlyerNumber: "" // Add FFN field
    })))
    
    // Initialize meals array for each passenger (default: no meal selected)
    setExtraServices(prev => ({
      ...prev,
      meals: Array(pax).fill('none')
    }))
  }, [])

  const steps = ["Passenger Details", "Seat Selection", "Add-ons", "Payment"]

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  // Function to fill passenger details from user profile
  const fillPassengerFromProfile = (index) => {
    if (!userProfileData) return
    
    const newPassengers = [...passengers]
    newPassengers[index] = {
      ...userProfileData,
      wheelchairAssistance: false
    }
    setPassengers(newPassengers)
  }

  async function payAndBook() {
    // Prevent multiple submissions
    if (isBooking) return
    setIsBooking(true)

    // Generate a unique PNR number (6 alphanumeric characters)
    const generatePNR = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding confusing chars like I, O, 0, 1
      let pnr = ''
      for (let i = 0; i < 6; i++) {
        pnr += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return pnr
    }

    const pnr = generatePNR()
    const ref = `SKY${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const serviceCosts = calculateServiceCosts()
    const baseFarePerPassenger = flight.price * 0.85
    const taxesPerPassenger = flight.price * 0.15
    const totalBaseFare = baseFarePerPassenger * passengerCount
    const totalTaxes = taxesPerPassenger * passengerCount
    const totalCost = (flight.price * passengerCount) + seatUpgradeCost + serviceCosts.total

    // Get travel date from URL params or use tomorrow as default
    const urlParams = new URLSearchParams(window.location.search)
    const travelDate = urlParams.get('date') || (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    })()

    const bookingDetails = {
      userId: user?.id || null, // Add logged-in user ID or null for guest
      pnr,
      reference: ref,
      flight: {
        ...flight,
        date: travelDate // Add travel date to flight object
      },
      flightId: flight?.id,
      bookingDate: new Date().toISOString(),
      passengerCount,
      passengers,
      contactInfo,
      selectedSeats,
      extraServices,
      costs: {
        baseFare: Math.round(totalBaseFare),
        taxes: Math.round(totalTaxes),
        seatUpgrade: seatUpgradeCost,
        services: serviceCosts,
        total: Math.round(totalCost),
      }
    }

    try {
      // Send booking to backend
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingDetails)
      })
      const data = await res.json()
      if (data.success) {
        // Add loyalty points info to booking details
        const bookingDetailsWithLoyalty = {
          ...bookingDetails,
          loyaltyPointsEarned: data.loyaltyPointsEarned || 0
        }
        localStorage.setItem('bookingDetails', JSON.stringify(bookingDetailsWithLoyalty))
        router.push(`/booking/confirmation?ref=${encodeURIComponent(ref)}&pnr=${encodeURIComponent(pnr)}`)
      } else {
        alert('Booking failed: ' + (data.error || 'Unknown error'))
        setIsBooking(false) // Re-enable button on error
      }
    } catch (error) {
      console.error("Error during booking:", error)
      alert("An error occurred while processing your booking.")
      setIsBooking(false) // Re-enable button on error
    }
  }

  const handleSeatSelection = (seats, upgradeCost) => {
    setSelectedSeats(seats)
    // If SeatMap provides an upgradeCost use it, otherwise fallback to a per-seat default
    const SEAT_PRICE_FALLBACK = 300
    const computed = (typeof upgradeCost === 'number' && upgradeCost > 0)
      ? upgradeCost
      : (seats && seats.length ? seats.length * SEAT_PRICE_FALLBACK : 0)
    setSeatUpgradeCost(computed)
  }

  const calculateServiceCosts = () => {
    // Meal pricing: 'none' = 0, standard = 200, vegetarian/vegan = 500, special = 800
    const STANDARD_MEAL_PRICE = 200
    const mealCost = extraServices.meals.reduce((total, meal) => {
      if (!meal || meal === 'none') return total
      if (meal === 'vegetarian' || meal === 'vegan') return total + 500
      if (meal === 'special') return total + 800
      // standard meal
      return total + STANDARD_MEAL_PRICE
    }, 0)

    const luggageCost = extraServices.extraLuggage * 1200 // ₹1200 per extra 10kg
    const boardingCost = extraServices.priorityBoarding ? 800 : 0

    return {
      meals: mealCost,
      luggage: luggageCost,
      boarding: boardingCost,
      total: mealCost + luggageCost + boardingCost
    }
  }

  if (!flight) {
    return (
      <div className="min-h-dvh flex flex-col">
        <div className="max-w-6xl mx-auto px-4 py-6 w-full">
          <div className="rounded-xl border border-border/60 bg-background/70 p-8 text-center backdrop-blur">
            <p className="text-lg font-medium mb-2">No flight selected</p>
            <p className="text-muted-foreground mb-4">Please select a flight first.</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const serviceCosts = calculateServiceCosts()
  // flight.price already includes base fare + taxes (total price per passenger)
  const totalCost = flight ? (flight.price * passengerCount) + seatUpgradeCost + serviceCosts.total : 0

  // Get the airline color for this flight
  const airlineColor = flight ? getAirlineColor(flight.airline) : '#0ea5e9'

  return (
  <div className="min-h-dvh flex flex-col bg-black" style={{ '--airline-color': airlineColor }}>
      {/* Navbar is already rendered in layout.jsx */}
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-10 w-full">
        <div className="grid gap-8 md:grid-cols-3">
          <section className="md:col-span-2">
            <h1 className="mb-6 text-2xl font-semibold text-white">Complete your booking</h1>
            
            {/* Flight Summary */}
            <div className="mb-6 rounded-2xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 shadow-lg overflow-hidden backdrop-blur-xl text-white">
              <div className="bg-white/5 px-6 py-4 border-b border-[var(--airline-color,#0ea5e9)]/20">
                <h2 className="text-lg font-semibold text-white">Flight Summary</h2>
              </div>
              <div className="p-6">
                {/* Main Flight Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border-2 border-white bg-white/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {getAirlineCode(flight.airline)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {flight.airline || 'Airline'} {flight.number || 'Flight'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Aircraft: {flight.aircraftType || 'Boeing 737-800'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatPriceINR(flight.price)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{flight.class || 'Economy'} Class</p>
                  </div>
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Departure */}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(flight.departureTime)}</div>
                    <div className="text-lg font-semibold">{flight.from}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>

                  {/* Flight Path */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex-1 h-px bg-border"></div>
                      <div className="mx-2 p-2 rounded-full border-2 border-white bg-zinc-900/80 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {flight.durationMins ? `${Math.floor(flight.durationMins / 60)}h ${flight.durationMins % 60}m` : '2h 30m'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.stops === 0 ? "Direct flight" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatTime(flight.arrivalTime)}</div>
                    <div className="text-lg font-semibold">{flight.to}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mt-4 pt-4 border-t border-[var(--airline-color,#0ea5e9)]/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Terminal:</span>
                      <span className="ml-1 font-medium">{flight.terminal || 'T2'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gate:</span>
                      <span className="ml-1 font-medium">{flight.gate || 'A12'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Baggage:</span>
                      <span className="ml-1 font-medium">15kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="ml-1 font-medium">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 mb-4">
              <BookingStepper step={step} steps={steps} />
            </div>

            <div className="mt-8">
              {/* Step 0: Passenger Details */}
              {step === 0 && (
                <div className="rounded-2xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 shadow-lg space-y-6 p-6 backdrop-blur-xl text-white">
                  <h2 className="text-lg font-semibold text-white">Passenger Details</h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      next()
                    }}
                    className="space-y-6 [&_*]:text-white [&_label]:text-white [&_input]:bg-zinc-900/80 [&_input]:text-white [&_input]:border-zinc-700 [&_input]:placeholder:text-zinc-400 [&_select]:bg-zinc-900/80 [&_select]:text-white [&_select]:border-zinc-700 [&_option]:bg-zinc-900/80 [&_option]:text-white [&_textarea]:bg-zinc-900/80 [&_textarea]:text-white [&_textarea]:border-zinc-700"
                  >
                    {/* Contact Information (once for all passengers) */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-white border-b border-[var(--airline-color,#0ea5e9)]/30 pb-2">Contact Information</h3>
                      {isAuthenticated && userProfileData && (
                        <div className="text-xs text-white/80 bg-[var(--airline-color,#0ea5e9)]/10 border border-[var(--airline-color,#0ea5e9)]/20 rounded-md p-2">
                          ℹ️ Your contact details have been auto-filled. You can change them if needed.
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium">Email Address *</label>
                          <input
                            type="email"
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john.doe@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Phone Number *</label>
                          <input
                            type="tel"
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passenger Details (one section per passenger) */}
                    {passengers.map((passenger, index) => (
                      <div key={index} className="space-y-4 pt-4 border-t border-[var(--airline-color,#0ea5e9)]/30">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white">Passenger {index + 1}</h3>
                          {isAuthenticated && userProfileData && (
                            <button
                              type="button"
                              onClick={() => fillPassengerFromProfile(index)}
                              className="text-xs px-3 py-1.5 rounded-md bg-[var(--airline-color,#0ea5e9)]/10 text-[var(--airline-color,#0ea5e9)] hover:bg-[var(--airline-color,#0ea5e9)]/20 transition-colors font-medium"
                            >
                              Use My Details
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium">First Name *</label>
                            <input
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                              value={passenger.firstName}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].firstName = e.target.value
                                setPassengers(newPassengers)
                              }}
                              placeholder="John"
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Last Name *</label>
                            <input
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                              value={passenger.lastName}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].lastName = e.target.value
                                setPassengers(newPassengers)
                              }}
                              placeholder="Doe"
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Date of Birth *</label>
                            <input
                              type="date"
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                              value={passenger.dateOfBirth}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].dateOfBirth = e.target.value
                                setPassengers(newPassengers)
                              }}
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Gender *</label>
                            <select
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)]"
                              value={passenger.gender}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].gender = e.target.value
                                setPassengers(newPassengers)
                              }}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>                        {/* Travel Document */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium">Document Type *</label>
                            <select
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)]"
                              value={passenger.idType}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].idType = e.target.value
                                setPassengers(newPassengers)
                              }}
                            >
                              <option value="Passport">Passport</option>
                              <option value="Aadhaar">Aadhaar Card</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="Driving License">Driving License</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Document Number *</label>
                            <input
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                              value={passenger.idNumber}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].idNumber = e.target.value
                                setPassengers(newPassengers)
                              }}
                              placeholder="A1234567"
                              required
                            />
                          </div>
                        </div>

                        {/* Frequent Flyer Number */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-white">
                            Frequent Flyer Number (Optional)
                            {isAuthenticated && userFrequentFlyerNumber && (
                              <span className="ml-2 text-xs text-white/70">
                                - Your FFN: {userFrequentFlyerNumber}
                              </span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)] placeholder:text-zinc-400"
                              value={passenger.frequentFlyerNumber}
                              onChange={(e) => {
                                const newPassengers = [...passengers]
                                newPassengers[index].frequentFlyerNumber = e.target.value
                                setPassengers(newPassengers)
                              }}
                              placeholder="Enter FFN or use yours"
                            />
                            {isAuthenticated && userFrequentFlyerNumber && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newPassengers = [...passengers]
                                  newPassengers[index].frequentFlyerNumber = userFrequentFlyerNumber
                                  setPassengers(newPassengers)
                                }}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--airline-color,#0ea5e9)]/10 text-[var(--airline-color,#0ea5e9)] hover:bg-[var(--airline-color,#0ea5e9)]/20 transition-colors"
                              >
                                Use My FFN
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-white/70">
                            {isAuthenticated 
                              ? "Use your AML Airways Frequent Flyer Number to earn points on this booking"
                              : "Sign in to use your AML Airways Frequent Flyer Number and earn points"
                            }
                          </p>
                        </div>

                        {/* Wheelchair Assistance */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`wheelchair-${index}`}
                            className="rounded border-border"
                            checked={passenger.wheelchairAssistance}
                            onChange={(e) => {
                              const newPassengers = [...passengers]
                              newPassengers[index].wheelchairAssistance = e.target.checked
                              setPassengers(newPassengers)
                            }}
                          />
                          <label htmlFor={`wheelchair-${index}`} className="text-sm font-medium">
                            Wheelchair Assistance Required
                          </label>
                        </div>
                      </div>
                    ))}

                    <button 
                      type="submit"
                      className="w-full rounded-md bg-[var(--airline-color,#0ea5e9)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)]"
                    >
                      Continue to Seat Selection
                    </button>
                  </form>
                </div>
              )}

              {/* Step 1: Seat Selection */}
              {step === 1 && (
                <div className="rounded-2xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 p-5 backdrop-blur-xl text-white">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white">Choose Your Seats</h2>
                    <p className="text-sm text-white/80">
                      Select {passengerCount} seat{passengerCount > 1 ? 's' : ''} for {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <SeatMap onSeatSelect={handleSeatSelection} maxSeats={passengerCount} />
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={prev}
                      className="flex-1 rounded-md border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
                    >
                      Back to Details
                    </button>
                    <button
                      onClick={next}
                      className="flex-1 rounded-md bg-[var(--airline-color,#0ea5e9)] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
                    >
                      Continue to Add-ons
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Add-ons (Food & Luggage) */}
              {step === 2 && (
                <div className="rounded-2xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 p-5 backdrop-blur-xl space-y-6 text-white [&_*]:text-white [&_label]:text-white [&_input]:bg-zinc-900/80 [&_input]:text-white [&_input]:border-zinc-700 [&_select]:bg-zinc-900/80 [&_select]:text-white [&_select]:border-zinc-700 [&_option]:bg-zinc-900 [&_option]:text-white">
                  <h2 className="text-lg font-semibold text-white">Additional Services</h2>
                  
                  {/* Meal Selection */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b border-[var(--airline-color,#0ea5e9)]/30 pb-2 text-white">Meal Preferences</h3>
                    {Array.from({ length: passengerCount }, (_, index) => (
                      <div key={index} className="space-y-2">
                        <label className="text-sm font-medium">Passenger {index + 1} Meal</label>
                        <select
                          className="w-full rounded-md border border-zinc-700 bg-zinc-900/80 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--airline-color,#0ea5e9)]"
                          value={extraServices.meals[index] || 'none'}
                          onChange={(e) => {
                            const newMeals = [...extraServices.meals]
                            newMeals[index] = e.target.value
                            setExtraServices(prev => ({ ...prev, meals: newMeals }))
                          }}
                        >
                          <option value="none">No Meal</option>
                          <option value="standard">Standard Meal (+₹200)</option>
                          <option value="vegetarian">Vegetarian Meal (+₹500)</option>
                          <option value="vegan">Vegan Meal (+₹500)</option>
                          <option value="special">Special Diet Meal (+₹800)</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Extra Luggage */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b border-[var(--airline-color,#0ea5e9)]/30 pb-2 text-white">Extra Luggage</h3>
                    <div>
                      <label className="text-sm font-medium">Additional Luggage (10kg units)</label>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => setExtraServices(prev => ({ 
                            ...prev, 
                            extraLuggage: Math.max(0, prev.extraLuggage - 1) 
                          }))}
                          className="w-8 h-8 rounded-md border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 flex items-center justify-center hover:bg-white/10 text-white"
                        >
                          -
                        </button>
                        <span className="text-lg font-medium w-12 text-center text-white">
                          {extraServices.extraLuggage}
                        </span>
                        <button
                          onClick={() => setExtraServices(prev => ({ 
                            ...prev, 
                            extraLuggage: Math.min(5, prev.extraLuggage + 1) 
                          }))}
                          className="w-8 h-8 rounded-md border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 flex items-center justify-center hover:bg-white/10 text-white"
                        >
                          +
                        </button>
                        <span className="text-sm text-white/80">
                          {extraServices.extraLuggage > 0 && `+₹${(extraServices.extraLuggage * 1200).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        Standard: 15kg included • Extra: ₹1,200 per 10kg
                      </p>
                    </div>
                  </div>

                  {/* Priority Services */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b border-[var(--airline-color,#0ea5e9)]/30 pb-2 text-white">Priority Services</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="priority-boarding"
                        className="rounded border-border"
                        checked={extraServices.priorityBoarding}
                        onChange={(e) => setExtraServices(prev => ({ 
                          ...prev, 
                          priorityBoarding: e.target.checked 
                        }))}
                      />
                      <label htmlFor="priority-boarding" className="text-sm font-medium text-white">
                        Priority Boarding (+₹800)
                      </label>
                    </div>
                    <p className="text-xs text-white/70">
                      Board the aircraft first and get priority access to overhead bins
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={prev}
                      className="flex-1 rounded-md border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
                    >
                      Back to Seats
                    </button>
                    <button
                      onClick={next}
                      className="flex-1 rounded-md bg-[var(--airline-color,#0ea5e9)] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="rounded-2xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 p-5 backdrop-blur-xl text-white">
                  <h2 className="text-lg font-semibold mb-4 text-white">Payment Options</h2>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-white">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "Card"}
                          onChange={() => setPaymentMethod("Card")}
                          className="text-[var(--airline-color,#0ea5e9)]"
                        />
                        Credit/Debit Card
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-white">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "UPI"}
                          onChange={() => setPaymentMethod("UPI")}
                          className="text-[var(--airline-color,#0ea5e9)]"
                        />
                        UPI Payment
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-white">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "Wallet"}
                          onChange={() => setPaymentMethod("Wallet")}
                          className="text-[var(--airline-color,#0ea5e9)]"
                        />
                        Digital Wallet
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={prev}
                        disabled={isBooking}
                        className="flex-1 rounded-md border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Back to Add-ons
                    </button>
                    <button
                      onClick={payAndBook}
                        disabled={isBooking}
                        className="flex-1 rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isBooking ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          `Pay ${formatPriceINR(totalCost)}`
                        )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Booking Summary Sidebar */}
          <aside className="space-y-4">
            <div className="sticky top-10 rounded-2xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 shadow-2xl p-6 backdrop-blur-xl text-white">
              <h3 className="text-lg font-semibold mb-4 text-white">Booking Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Base Fare ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
                  <span>{formatPriceINR(flight.price * 0.85 * passengerCount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Fees</span>
                  <span>{formatPriceINR(flight.price * 0.15 * passengerCount)}</span>
                </div>
                        {seatUpgradeCost > 0 && (
                          <div className="flex justify-between">
                            <span>Seat Upgrade</span>
                            <span>{formatPriceINR(seatUpgradeCost)}</span>
                          </div>
                        )}

                        {serviceCosts.meals > 0 && (
                          <div className="flex justify-between">
                            <span>Meal Charges</span>
                            <span>{formatPriceINR(serviceCosts.meals)}</span>
                          </div>
                        )}

                        {serviceCosts.luggage > 0 && (
                          <div className="flex justify-between">
                            <span>Extra Luggage</span>
                            <span>{formatPriceINR(serviceCosts.luggage)}</span>
                          </div>
                        )}

                        {serviceCosts.boarding > 0 && (
                          <div className="flex justify-between">
                            <span>Priority Boarding</span>
                            <span>{formatPriceINR(serviceCosts.boarding)}</span>
                          </div>
                        )}
                <div className="border-t border-[var(--airline-color,#0ea5e9)]/30 pt-3 flex justify-between font-semibold text-base">
                  <span className="text-white">Total Amount</span>
                  <span className="text-[var(--airline-color,#0ea5e9)]">{formatPriceINR(totalCost)}</span>
                </div>
              </div>

              {/* Loyalty Points Preview */}
              {isAuthenticated && userFrequentFlyerNumber && passengers.some(p => p.frequentFlyerNumber === userFrequentFlyerNumber) && (
                <div className="mt-4 pt-4 border-t border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[var(--airline-color,#0ea5e9)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h4 className="font-medium text-sm text-[var(--airline-color,#0ea5e9)]">Loyalty Points</h4>
                  </div>
                  <p className="text-xs text-white/70">
                    You'll earn <span className="font-bold text-[var(--airline-color,#0ea5e9)]">{Math.floor(totalCost / 200)}</span> points with this booking!
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    (₹200 = 1 point)
                  </p>
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--airline-color,#0ea5e9)]/30">
                  <h4 className="font-medium mb-2 text-white">Selected Seats</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedSeats.map(seat => (
                      <span key={seat} className="px-2 py-1 bg-[var(--airline-color,#0ea5e9)]/20 text-[var(--airline-color,#0ea5e9)] border border-[var(--airline-color,#0ea5e9)]/30 rounded text-xs">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedSeats.length === 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--airline-color,#0ea5e9)]/30 text-sm text-white/60">
                  No seats selected — a seat will be auto-assigned during check-in if you don't pick one now.
                </div>
              )}

              {step >= 2 && (
                <div className="mt-4 pt-4 border-t border-[var(--airline-color,#0ea5e9)]/30">
                  <h4 className="font-medium mb-2 text-white">Services Summary</h4>
                  <div className="space-y-1 text-xs text-white/70">
                    {extraServices.meals.filter(meal => meal !== 'none').length > 0 && (
                      <div>• Meal selections for {extraServices.meals.filter(meal => meal !== 'none').length} passenger{extraServices.meals.filter(meal => meal !== 'none').length > 1 ? 's' : ''}</div>
                    )}
                    {extraServices.extraLuggage > 0 && (
                      <div>• {extraServices.extraLuggage} × 10kg extra luggage</div>
                    )}
                    {extraServices.priorityBoarding && (
                      <div>• Priority boarding for all passengers</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}