"use client"

import { useMemo, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import Footer from "@/components/footer"

const fetcher = (url) => fetch(url).then((r) => r.json())

// Helper function to get airline colors
const getAirlineColors = (airlineCode) => {
  const colors = {
    // Indian Airlines
    '6E': { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' }, // IndiGo
    'AI': { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' }, // Air India
    'SG': { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' }, // SpiceJet
    'G8': { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50' }, // GoAir
    'I5': { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50' }, // AirAsia India
    'UK': { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50' }, // Vistara
    'IX': { bg: 'bg-yellow-600', text: 'text-yellow-600', light: 'bg-yellow-50' }, // Air India Express
    
    // International Airlines
    'EK': { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50' }, // Emirates
    'QR': { bg: 'bg-purple-700', text: 'text-purple-700', light: 'bg-purple-50' }, // Qatar Airways
    'BA': { bg: 'bg-blue-800', text: 'text-blue-800', light: 'bg-blue-50' }, // British Airways
    'LH': { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' }, // Lufthansa
    'AF': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' }, // Air France
    'KL': { bg: 'bg-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-50' }, // KLM
    'TK': { bg: 'bg-red-700', text: 'text-red-700', light: 'bg-red-50' }, // Turkish Airlines
    'EY': { bg: 'bg-amber-600', text: 'text-amber-700', light: 'bg-amber-50' }, // Etihad Airways
    'SV': { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-50' }, // Saudi Arabian Airlines
    'TG': { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' }, // Thai Airways
    'SQ': { bg: 'bg-blue-700', text: 'text-blue-700', light: 'bg-blue-50' }, // Singapore Airlines
    'CX': { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50' }, // Cathay Pacific
    'AA': { bg: 'bg-red-800', text: 'text-red-800', light: 'bg-red-50' }, // American Airlines
    'DL': { bg: 'bg-blue-900', text: 'text-blue-900', light: 'bg-blue-50' }, // Delta Air Lines
    'UA': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' }, // United Airlines
    
    'default': { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-50' }
  }
  return colors[airlineCode] || colors.default
}

// Helper function to get airline name
const getAirlineName = (airlineCode) => {
  const names = {
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
    'EY': 'Etihad Airways',
    'SV': 'Saudi Arabian Airlines',
    'TG': 'Thai Airways',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'UA': 'United Airlines'
  }
  return names[airlineCode] || airlineCode
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

// Helper function to format duration
const formatDuration = (durationMins) => {
  if (!durationMins) return "-- --"
  const hours = Math.floor(durationMins / 60)
  const minutes = durationMins % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default function FlightDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [localFlight, setLocalFlight] = useState(null)
  const { data, isLoading } = useSWR(`/api/flight/${id}`, fetcher)

  // Try to get flight data from localStorage if API fails
  useEffect(() => {
    const storedFlight = localStorage.getItem('selectedFlight')
    if (storedFlight) {
      try {
        setLocalFlight(JSON.parse(storedFlight))
      } catch (e) {
        console.error('Failed to parse stored flight data:', e)
      }
    }
  }, [])

  const flight = useMemo(() => {
    // Use API data if available, otherwise use localStorage data
    return data?.flight || localFlight || null
  }, [data, localFlight])

  const airlineColors = flight ? getAirlineColors(flight.airlineCode || flight.airline) : null

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Navbar is already rendered in layout.jsx */}
      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        {!flight ? (
          <div className="rounded-lg border border-border/60 bg-background/60 p-8 text-center backdrop-blur">
            {isLoading ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                <p>Loading flight details...</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Flight not found</p>
                <p className="text-muted-foreground mb-4">The flight you're looking for doesn't exist or has expired.</p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Home
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-2 space-y-6">
              {/* Enhanced Flight Header */}
              <header className="rounded-xl border border-border/60 bg-background/70 p-6 backdrop-blur">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl ${airlineColors?.light || 'bg-gray-50'} flex items-center justify-center border-2 ${airlineColors?.bg || 'border-gray-200'}`}>
                      <span className={`text-xl font-bold ${airlineColors?.text || 'text-gray-600'}`}>
                        {flight.airlineCode || flight.airline?.substring(0, 2) || 'FL'}
                      </span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {getAirlineName(flight.airlineCode || flight.airline)} {flight.number}
                      </h1>
                      <p className="text-muted-foreground font-medium">
                        {flight.aircraftType || flight.aircraft || 'Boeing 737-800'} • Economy Class
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {formatPriceINR(flight.price)}
                    </div>
                    <p className="text-sm text-muted-foreground">per person</p>
                  </div>
                </div>

                {/* Route Timeline */}
                <div className="grid grid-cols-3 gap-6 items-center bg-muted/30 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{formatTime(flight.departureTime)}</div>
                    <div className="text-xl font-semibold text-foreground">{flight.from}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Terminal {flight.terminal || 'T2'}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex-1 h-0.5 bg-border"></div>
                      <div className={`mx-3 p-2 rounded-full ${airlineColors?.light || 'bg-gray-100'}`}>
                        <svg className={`w-6 h-6 ${airlineColors?.text || 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                      <div className="flex-1 h-0.5 bg-border"></div>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDuration(flight.durationMins)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {flight.stops === 0 ? "Direct flight" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </div>
                    {flight.stopovers && flight.stopovers.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        via {flight.stopovers.map(stop => stop.airport).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{formatTime(flight.arrivalTime)}</div>
                    <div className="text-xl font-semibold text-foreground">{flight.to}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('en-IN', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Terminal {flight.terminal || 'T1'}
                    </div>
                  </div>
                </div>
              </header>

              {/* Enhanced Fare Breakdown */}
              <div className="rounded-xl border border-border/60 bg-background/70 p-6 backdrop-blur">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Fare & Baggage Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Price Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Fare</span>
                        <span className="font-medium">{formatPriceINR(flight.basePrice || flight.price * 0.85)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxes & Fees</span>
                        <span className="font-medium">{formatPriceINR(flight.fees || flight.price * 0.15)}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPriceINR(flight.price)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Baggage Allowance</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carry-on</span>
                        <span className="font-medium">1 bag (7kg)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Checked baggage</span>
                        <span className="font-medium">1 bag (15kg)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extra baggage</span>
                        <span className="font-medium">₹1,200 per 10kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stopover Details Section - only show if there are stopovers */}
              {flight.stopovers && flight.stopovers.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-background/70 p-6 backdrop-blur">
                  <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Stopover Information
                  </h2>
                  <div className="space-y-4">
                    {flight.stopovers.map((stopover, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{stopover.airport}</p>
                          <p className="text-sm text-muted-foreground">Stopover {index + 1}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {Math.floor(stopover.duration / 60)}h {stopover.duration % 60}m
                          </p>
                          <p className="text-sm text-muted-foreground">Layover time</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/60 bg-background/70 p-6 backdrop-blur">
                <h2 className="mb-3 text-lg font-semibold">Aircraft Information</h2>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Aircraft Type</p>
                    <p className="font-medium">{flight.aircraft || 'Boeing 737-800'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Configuration</p>
                    <p className="font-medium">Economy • Business</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Seat Pitch</p>
                    <p className="font-medium">32 inches</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Wi-Fi Available</p>
                    <p className="font-medium">Yes (Paid)</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/70 p-5 backdrop-blur">
                <h2 className="mb-3 text-lg font-semibold">Flight Amenities</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>In-flight Meals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Entertainment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>USB Charging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Priority Boarding</span>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              {/* Enhanced Booking Summary */}
              <div className="sticky top-6 z-50 rounded-xl border border-border/60 bg-background/70 p-6 backdrop-blur">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${airlineColors?.light || 'bg-gray-50'} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${airlineColors?.text || 'text-gray-600'}`}>
                      {flight.airlineCode || flight.airline?.substring(0, 2) || 'FL'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Quick Booking</h3>
                    <p className="text-sm text-muted-foreground">{getAirlineName(flight.airlineCode || flight.airline)}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span className="font-medium">{formatPriceINR(flight.basePrice || flight.price * 0.85)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & Fees</span>
                    <span className="font-medium">{formatPriceINR(flight.fees || flight.price * 0.15)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatPriceINR(flight.price)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Store flight data for booking page
                      localStorage.setItem('bookingFlight', JSON.stringify(flight))
                      router.push("/booking")
                    }}
                    className={`w-full rounded-lg ${airlineColors?.bg || 'bg-primary'} px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all`}
                  >
                    Book This Flight
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  >
                    Back to Search
                  </button>
                </div>
              </div>

              {/* Flight Highlights */}
              <div className="rounded-xl border border-border/60 bg-background/70 p-5 backdrop-blur">
                <h3 className="text-lg font-semibold mb-3">Flight Highlights</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${flight.stops === 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span>{flight.stops === 0 ? 'Direct Flight' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Free Cancellation (24h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Seat Selection Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>Meals Included</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}