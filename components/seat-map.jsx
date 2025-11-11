"use client"

import { useState } from "react"

// Define seat types and pricing
const SEAT_TYPES = {
  ECONOMY: { price: 0, color: 'bg-white/10 border-white/30 text-white', label: 'Economy' },
  PREMIUM: { price: 2500, color: 'bg-purple-500/20 border-purple-400/40 text-purple-200', label: 'Premium Economy' },
  BUSINESS: { price: 8500, color: 'bg-amber-500/20 border-amber-400/40 text-amber-200', label: 'Business' }
}

// Aircraft layout configuration
const AIRCRAFT_CONFIG = {
  sections: [
    { name: 'Business Class', rows: [1, 2, 3], seats: ['A', 'C', 'D', 'F'], type: 'BUSINESS' },
    { name: 'Premium Economy', rows: [4, 5, 6], seats: ['A', 'B', 'C', 'D', 'E', 'F'], type: 'PREMIUM' },
    { name: 'Economy Class', rows: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], seats: ['A', 'B', 'C', 'D', 'E', 'F'], type: 'ECONOMY' }
  ]
}

// Some seats are occupied (for realism)
const OCCUPIED_SEATS = ['2A', '2F', '4B', '4E', '7A', '7F', '8C', '8D', '10A', '12F', '15B', '15E', '17C', '19A', '19F']

// Helper function to format price in Indian Rupees
const formatPriceINR = (price) => {
  if (price === 0) return 'Included'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

export default function SeatMap({ onSeatSelect, maxSeats = 1 }) {
  const [selectedSeats, setSelectedSeats] = useState([])

  function toggleSeat(seatId, seatType) {
    if (OCCUPIED_SEATS.includes(seatId)) return
    
    let newSelection
    if (selectedSeats.includes(seatId)) {
      // Deselect seat
      newSelection = selectedSeats.filter(s => s !== seatId)
    } else {
      // Select seat - check if we've reached the limit
      if (selectedSeats.length >= maxSeats) {
        alert(`You can only select up to ${maxSeats} seat${maxSeats > 1 ? 's' : ''} for ${maxSeats} passenger${maxSeats > 1 ? 's' : ''}.`)
        return
      }
      newSelection = [...selectedSeats, seatId]
    }
    
    setSelectedSeats(newSelection)
    
    // Calculate total extra cost
    const totalExtra = newSelection.reduce((sum, seat) => {
      const section = AIRCRAFT_CONFIG.sections.find(s => 
        s.rows.includes(parseInt(seat)) && SEAT_TYPES[s.type]
      )
      return sum + (section ? SEAT_TYPES[section.type].price : 0)
    }, 0)
    
    onSeatSelect?.(newSelection, totalExtra)
  }

  function getSeatStatus(seatId, seatType) {
    if (OCCUPIED_SEATS.includes(seatId)) return 'occupied'
    if (selectedSeats.includes(seatId)) return 'selected'
    return 'available'
  }

  function getSeatStyles(seatId, seatType) {
    const status = getSeatStatus(seatId, seatType)
    const typeConfig = SEAT_TYPES[seatType]
    
    if (status === 'occupied') {
      return 'bg-zinc-700/50 border-zinc-600 text-zinc-400 cursor-not-allowed'
    }
    if (status === 'selected') {
      return 'bg-[var(--airline-color,#0ea5e9)] border-[var(--airline-color,#0ea5e9)] text-white shadow-md transform scale-105'
    }
    return `${typeConfig.color} hover:shadow-md hover:scale-105 cursor-pointer transition-all duration-200`
  }

  return (
    <div className="space-y-6">
      {/* Aircraft Visual */}
      <div className="bg-white/5 rounded-lg p-6 border-2 border-[var(--airline-color,#0ea5e9)]/30 backdrop-blur-xl">
        {/* Cockpit */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-8 bg-zinc-700 rounded-t-full flex items-center justify-center">
            <span className="text-xs text-white font-semibold">COCKPIT</span>
          </div>
        </div>

        {/* Seat Map */}
        <div className="space-y-6">
          {AIRCRAFT_CONFIG.sections.map((section, sectionIdx) => (
            <div key={section.name} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-white">{section.name}</h4>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--airline-color,#0ea5e9)]/20 text-[var(--airline-color,#0ea5e9)] border border-[var(--airline-color,#0ea5e9)]/30">
                  +{formatPriceINR(SEAT_TYPES[section.type].price)}
                </span>
              </div>
              
              {/* Section Divider */}
              {sectionIdx > 0 && <div className="border-t border-[var(--airline-color,#0ea5e9)]/30 my-4"></div>}
              
              {/* Seats Grid */}
              <div className="space-y-2">
                {section.rows.map(row => (
                  <div key={row} className="flex items-center justify-center gap-1">
                    {/* Row Number */}
                    <div className="w-6 text-xs text-white/70 text-center font-mono">
                      {row}
                    </div>
                    
                    {/* Left Side Seats */}
                    <div className="flex gap-1">
                      {section.seats.slice(0, Math.ceil(section.seats.length / 2)).map(letter => {
                        const seatId = `${row}${letter}`
                        return (
                          <button
                            key={seatId}
                            onClick={() => toggleSeat(seatId, section.type)}
                            disabled={OCCUPIED_SEATS.includes(seatId)}
                            className={`w-8 h-8 rounded-md border text-xs font-medium transition-all duration-200 ${getSeatStyles(seatId, section.type)}`}
                            title={`Seat ${seatId} - ${SEAT_TYPES[section.type].label} (+${formatPriceINR(SEAT_TYPES[section.type].price)})`}
                          >
                            {letter}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Aisle */}
                    <div className="w-6 flex justify-center">
                      <div className="w-1 h-6 bg-[var(--airline-color,#0ea5e9)]/30 rounded"></div>
                    </div>
                    
                    {/* Right Side Seats */}
                    <div className="flex gap-1">
                      {section.seats.slice(Math.ceil(section.seats.length / 2)).map(letter => {
                        const seatId = `${row}${letter}`
                        return (
                          <button
                            key={seatId}
                            onClick={() => toggleSeat(seatId, section.type)}
                            disabled={OCCUPIED_SEATS.includes(seatId)}
                            className={`w-8 h-8 rounded-md border text-xs font-medium transition-all duration-200 ${getSeatStyles(seatId, section.type)}`}
                            title={`Seat ${seatId} - ${SEAT_TYPES[section.type].label} (+${formatPriceINR(SEAT_TYPES[section.type].price)})`}
                          >
                            {letter}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-white">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 border border-white/30 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--airline-color,#0ea5e9)] border border-[var(--airline-color,#0ea5e9)] rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-zinc-700/50 border border-zinc-600 rounded"></div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500/20 border border-amber-400/40 rounded"></div>
          <span>Premium</span>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="rounded-lg border border-[var(--airline-color,#0ea5e9)]/30 bg-white/10 p-4 backdrop-blur-xl">
          <h4 className="font-semibold text-white mb-2">Selected Seats</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedSeats.map(seat => {
              const section = AIRCRAFT_CONFIG.sections.find(s => 
                s.rows.includes(parseInt(seat))
              )
              return (
                <span 
                  key={seat} 
                  className="px-2 py-1 bg-[var(--airline-color,#0ea5e9)]/20 text-[var(--airline-color,#0ea5e9)] border border-[var(--airline-color,#0ea5e9)]/30 rounded text-sm font-medium"
                >
                  {seat} ({SEAT_TYPES[section?.type]?.label})
                </span>
              )
            })}
          </div>
          <p className="text-sm text-white">
            Total seat upgrade: <span className="font-bold text-[var(--airline-color,#0ea5e9)]">{formatPriceINR(selectedSeats.reduce((sum, seat) => {
              const section = AIRCRAFT_CONFIG.sections.find(s => 
                s.rows.includes(parseInt(seat))
              )
              return sum + (section ? SEAT_TYPES[section.type].price : 0)
            }, 0))}</span>
          </p>
        </div>
      )}
    </div>
  )
}
