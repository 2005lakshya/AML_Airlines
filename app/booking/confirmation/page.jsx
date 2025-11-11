"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Helper function to save booking to history
const saveBookingToHistory = (booking) => {
  if (typeof window === "undefined") return
  try {
    const bookings = JSON.parse(localStorage.getItem('booking_history') || '[]')
    const bookingWithTimestamp = {
      ...booking,
      bookedAt: new Date().toISOString(),
      status: 'confirmed'
    }
    bookings.push(bookingWithTimestamp)
    localStorage.setItem('booking_history', JSON.stringify(bookings))
  } catch (e) {
    console.error('Failed to save booking to history:', e)
  }
}

const formatTime = (timeInput) => {
  if (!timeInput) return "--:--"
  // Accept either HH:MM or ISO timestamp
  try {
    if (typeof timeInput === 'string' && timeInput.includes('T')) {
      const d = new Date(timeInput)
      if (isNaN(d)) return '--:--'
      let hours = d.getHours()
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours)
      return `${hours}:${minutes} ${ampm}`
    }
    if (typeof timeInput === 'string' && timeInput.includes(':')) {
      const [hours, minutes] = timeInput.split(':')
      const hour24 = parseInt(hours)
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      return `${hour12}:${minutes} ${ampm}`
    }
    // Fallback: try constructing a date
    const d = new Date(timeInput)
    if (isNaN(d)) return '--:--'
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours)
    return `${hours}:${minutes} ${ampm}`
  } catch (e) {
    return '--:--'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function BookingConfirmationPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const ref = sp.get("ref") || "BK-XXXXXX"
  const [bookingDetails, setBookingDetails] = useState(null)

  useEffect(() => {
    // Get booking details from localStorage
    const details = localStorage.getItem('bookingDetails')
    if (details) {
      try {
        const booking = JSON.parse(details)
        setBookingDetails(booking)
        
        // Save to booking history
        saveBookingToHistory(booking)
        
        // Clean up temporary booking data
        localStorage.removeItem('bookingDetails')
      } catch (e) {
        console.error('Failed to parse booking details:', e)
      }
    }
  }, [])

  if (!bookingDetails) {
    return (
      <div className="min-h-dvh bg-black text-white">
        <div className="mx-auto max-w-xl p-6 pt-28">
          <div className="rounded-xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 p-6 backdrop-blur-xl text-center">
            <h1 className="text-2xl font-semibold text-white">Booking Confirmed</h1>
            <p className="mt-2 text-sm text-white/70">
              Your reference is <span className="font-medium text-white">{ref}</span>
            </p>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 inline-flex rounded-md border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { flight, costs, passengerCount, selectedSeats, extraServices, passengers, contactInfo, pnr } = bookingDetails
  const f = flight || {}
  // prefer ISO timestamps if available, otherwise HH:MM
  const depTime = f.departureAtFull || f.departureTime || f.departure || null
  const arrTime = f.arrivalAtFull || f.arrivalTime || f.arrival || null
  const depDateForDisplay = f.departureAtFull || bookingDetails.bookingDate || null
  const durationText = f.durationMins ? `${Math.floor(f.durationMins/60)}h ${f.durationMins % 60}m` : (f.duration || '')
  const airlineName = f.airline || f.airlineCode || bookingDetails.airline || ''
  const flightNumber = f.number || f.flightNumber || ''

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-4xl p-6 pt-28">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-500">Booking Confirmed!</h1>
            <p className="mt-2 text-white/70">
              Your booking has been successfully confirmed.
            </p>
            {pnr && (
              <div className="mt-4 inline-flex flex-col items-center bg-[var(--airline-color,#0ea5e9)]/10 border border-[var(--airline-color,#0ea5e9)]/30 rounded-lg px-6 py-3">
                <span className="text-sm font-medium text-white/70">PNR Number</span>
                <span className="text-2xl font-bold text-[var(--airline-color,#0ea5e9)] tracking-wider">{pnr}</span>
              </div>
            )}
            <p className="mt-3 text-sm text-white/70">
              Booking Reference: <span className="font-semibold text-white">{ref}</span>
            </p>
          </div>

          {/* Flight Details */}
          <div className="rounded-xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 backdrop-blur-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Flight Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">{f.from || f.origin || 'N/A'} → {f.to || f.destination || 'N/A'}</h3>
                  <p className="text-sm text-white/70">{formatDate(depDateForDisplay)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{airlineName}</p>
                  <p className="text-sm text-white/70">Flight {flightNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Departure</span>
                  <p className="font-medium text-white">{formatTime(depTime)}</p>
                </div>
                <div>
                  <span className="text-white/70">Arrival</span>
                  <p className="font-medium text-white">{formatTime(arrTime)}</p>
                </div>
                <div>
                  <span className="text-white/70">Duration</span>
                  <p className="font-medium text-white">{durationText}</p>
                </div>
                <div>
                  <span className="text-white/70">Passengers</span>
                  <p className="font-medium text-white">{passengerCount}</p>
                </div>
              </div>

              {selectedSeats && selectedSeats.length > 0 && (
                <div>
                  <span className="text-white/70 text-sm">Selected Seats</span>
                  <p className="font-medium text-white">{selectedSeats.join(', ')}</p>
                </div>
              )}
              {(!selectedSeats || selectedSeats.length === 0) && (
                <div>
                  <span className="text-white/70 text-sm">Seat Assignment</span>
                  <p className="font-medium text-white">No seats selected — a seat will be auto-assigned during check-in.</p>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Information */}
          <div className="rounded-xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 backdrop-blur-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Passenger Information</h2>
            
            {/* Contact Info */}
            <div className="mb-4 pb-4 border-b border-[var(--airline-color,#0ea5e9)]/30">
              <h3 className="font-medium mb-2 text-white">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Email</span>
                  <p className="font-medium text-white">{contactInfo?.email || bookingDetails.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-white/70">Phone</span>
                  <p className="font-medium text-white">{contactInfo?.phone || bookingDetails.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            {passengers && passengers.length > 0 ? (
              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div key={index} className="pb-4 border-b border-[var(--airline-color,#0ea5e9)]/30 last:border-0">
                    <h3 className="font-medium mb-2 text-white">Passenger {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Name</span>
                        <p className="font-medium text-white">{passenger.firstName} {passenger.lastName}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Date of Birth</span>
                        <p className="font-medium text-white">{passenger.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Gender</span>
                        <p className="font-medium text-white">{passenger.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Travel Document</span>
                        <p className="font-medium text-white">{passenger.idType}: {passenger.idNumber || 'N/A'}</p>
                      </div>
                      {passenger.frequentFlyerNumber && (
                        <div>
                          <span className="text-white/70">Frequent Flyer Number</span>
                          <p className="font-medium text-[var(--airline-color,#0ea5e9)]">{passenger.frequentFlyerNumber}</p>
                        </div>
                      )}
                      {passenger.wheelchairAssistance && (
                        <div className="col-span-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            ♿ Wheelchair Assistance Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/70">No passenger details available.</div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-xl border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 backdrop-blur-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Cost Breakdown</h2>
            <div className="space-y-2 text-sm text-white">
              <div className="flex justify-between">
                <span>Base Fare ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
                <span>₹{costs?.baseFare?.toLocaleString('en-IN') || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>₹{costs?.taxes?.toLocaleString('en-IN') || '0'}</span>
              </div>
              {costs?.seatUpgrade > 0 && (
                <div className="flex justify-between">
                  <span>Seat Upgrade</span>
                  <span>₹{costs.seatUpgrade?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {costs?.services?.meals > 0 && (
                <div className="flex justify-between">
                  <span>Meal Charges</span>
                  <span>₹{costs.services.meals?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {costs?.services?.luggage > 0 && (
                <div className="flex justify-between">
                  <span>Extra Luggage</span>
                  <span>₹{costs.services.luggage?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {costs?.services?.boarding > 0 && (
                <div className="flex justify-between">
                  <span>Priority Boarding</span>
                  <span>₹{costs.services.boarding?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-[var(--airline-color,#0ea5e9)]/30 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-white">Total Amount</span>
                  <span className="text-[var(--airline-color,#0ea5e9)]">₹{costs?.total?.toLocaleString('en-IN') || '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Points Earned */}
          {bookingDetails.loyaltyPointsEarned > 0 && (
            <div className="rounded-xl border-2 border-[var(--airline-color,#0ea5e9)]/50 bg-[var(--airline-color,#0ea5e9)]/10 backdrop-blur-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--airline-color,#0ea5e9)]/20 border border-[var(--airline-color,#0ea5e9)] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--airline-color,#0ea5e9)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--airline-color,#0ea5e9)]">Congratulations! 🎉</h3>
                  <p className="text-sm text-white">
                    You earned <span className="font-bold text-[var(--airline-color,#0ea5e9)] text-lg">{bookingDetails.loyaltyPointsEarned}</span> loyalty points with this booking!
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    (Earned at ₹200 = 1 point)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl p-6">
            <h2 className="text-lg font-semibold text-amber-400 mb-3">Important Information</h2>
            <ul className="text-sm text-white/80 space-y-2">
              <li>• Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights</li>
              <li>• Carry a valid government-issued photo ID for domestic flights or passport for international flights</li>
              <li>• Check-in opens 24 hours before departure and closes 45 minutes before departure</li>
              <li>• This booking reference can be used to view your trip details in your profile page</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/profile')}
              className="px-6 py-3 bg-[var(--airline-color,#0ea5e9)] text-white rounded-md hover:opacity-90 transition-colors"
            >
              View in Profile
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-[var(--airline-color,#0ea5e9)]/30 bg-white/5 text-white rounded-md hover:bg-white/10 transition-colors"
            >
              Book Another Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
