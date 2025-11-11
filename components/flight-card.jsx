"use client"

import { motion } from "framer-motion"

// Helper function to get airline colors
const getAirlineColors = (airlineCode) => {
  const colors = {
    // Indian Airlines
    '6E': { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-200' }, // IndiGo
    'AI': { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-200' }, // Air India
    'SG': { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50', border: 'border-red-200' }, // SpiceJet
    'G8': { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50', border: 'border-green-200' }, // GoAir
    'I5': { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-200' }, // AirAsia India
    'UK': { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50', border: 'border-pink-200' }, // Vistara
    'IX': { bg: 'bg-yellow-600', text: 'text-yellow-600', light: 'bg-yellow-50', border: 'border-yellow-200' }, // Air India Express
    
    // International Airlines - Middle East
    'EK': { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-300' }, // Emirates
    'QR': { bg: 'bg-purple-700', text: 'text-purple-700', light: 'bg-purple-50', border: 'border-purple-300' }, // Qatar Airways
    'EY': { bg: 'bg-amber-600', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-300' }, // Etihad Airways
    'FZ': { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50', border: 'border-red-300' }, // Fly Dubai
    'GF': { bg: 'bg-amber-600', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-300' }, // Gulf Air
    'KU': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-300' }, // Kuwait Airways
    'SV': { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-300' }, // Saudi Arabian Airlines
    'WY': { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-300' }, // Oman Air
    
    // International Airlines - Europe
    'BA': { bg: 'bg-blue-800', text: 'text-blue-800', light: 'bg-blue-50', border: 'border-blue-300' }, // British Airways
    'LH': { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-300' }, // Lufthansa
    'AF': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-300' }, // Air France
    'KL': { bg: 'bg-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-300' }, // KLM
    'TK': { bg: 'bg-red-700', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-300' }, // Turkish Airlines
    'AY': { bg: 'bg-blue-700', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-300' }, // Finnair
    'IB': { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-300' }, // Iberia
    'LO': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-300' }, // LOT Polish Airlines
    'LX': { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-300' }, // Swiss International Air Lines
    
    // International Airlines - Asia Pacific
    'TG': { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-300' }, // Thai Airways
    'SQ': { bg: 'bg-blue-700', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-300' }, // Singapore Airlines
    'CX': { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-300' }, // Cathay Pacific
    'UL': { bg: 'bg-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-300' }, // SriLankan Airlines
    
    // International Airlines - Africa & Others
    'ET': { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-300' }, // Ethiopian Airlines
    'HY': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-300' }, // Uzbekistan Airways
    'MS': { bg: 'bg-blue-700', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-300' }, // EgyptAir
    
    // International Airlines - Americas
    'AA': { bg: 'bg-red-800', text: 'text-red-800', light: 'bg-red-50', border: 'border-red-300' }, // American Airlines
    'DL': { bg: 'bg-blue-900', text: 'text-blue-900', light: 'bg-blue-50', border: 'border-blue-300' }, // Delta Air Lines
    'UA': { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-300' }, // United Airlines
    'AC': { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-300' }, // Air Canada
    
    'default': { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-50', border: 'border-gray-200' }
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
    
    // International Airlines - Middle East
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'EY': 'Etihad Airways',
    'FZ': 'Fly Dubai',
    'GF': 'Gulf Air',
    'KU': 'Kuwait Airways',
    'SV': 'Saudi Arabian Airlines',
    'WY': 'Oman Air',
    
    // International Airlines - Europe
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM',
    'TK': 'Turkish Airlines',
    'AY': 'Finnair',
    'IB': 'Iberia',
    'LO': 'LOT Polish Airlines',
    'LX': 'Swiss International Air Lines',
    
    // International Airlines - Asia Pacific
    'TG': 'Thai Airways',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'UL': 'SriLankan Airlines',
    
    // International Airlines - Africa & Others
    'ET': 'Ethiopian Airlines',
    'HY': 'Uzbekistan Airways',
    'MS': 'EgyptAir',
    
    // International Airlines - Americas
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'UA': 'United Airlines',
    'AC': 'Air Canada'
  }
  return names[airlineCode] || airlineCode
}

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (timeString) => {
  if (!timeString || timeString === "" || timeString === "--:--") return "TBD"
  
  try {
    const [hours, minutes] = timeString.split(':')
    if (!hours || !minutes) return "TBD"
    
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    
    return `${hour12}:${minutes} ${ampm}`
  } catch (e) {
    return "TBD"
  }
}

// Helper function to format price in Indian Rupees
const formatPriceINR = (price) => {
  if (!price || price === 0) return "₹TBD"
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

// Helper function to format duration
const formatDuration = (durationMins) => {
  if (!durationMins || durationMins === 0) return "TBD"
  
  const hours = Math.floor(durationMins / 60)
  const minutes = durationMins % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default function FlightCard({ flight, index = 0, onSelect }) {
  const airlineColors = getAirlineColors(flight.airlineCode || flight.airline)
  const comparisons = flight.comparisons || []
  const cheapest = comparisons.length ? comparisons.reduce((a, b) => (a.price <= b.price ? a : b)) : null
  
  return (
    <motion.button
      onClick={onSelect}
  className={`w-full rounded-xl border ${airlineColors.border} bg-background/70 p-4 text-left shadow-sm backdrop-blur hover:shadow-md transition-all duration-200`}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 160, damping: 18 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg ${airlineColors.light} flex items-center justify-center border ${airlineColors.border}`}>
            <span className={`text-sm font-bold ${airlineColors.text}`}>
              {flight.airlineCode || flight.airline?.substring(0, 2) || 'FL'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {getAirlineName(flight.airlineCode || flight.airline)} {flight.number || 'Flight'}
            </p>
              <p className="text-xs text-muted-foreground font-medium">
              {flight.from || 'DEP'} → {flight.to || 'ARR'} • {flight.aircraftType || flight.aircraft || 'Boeing 737'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${airlineColors.text}`}>{formatPriceINR(flight.price)}</p>
          <p className="text-xs text-muted-foreground capitalize">{flight.class || 'economy'} class</p>
          {comparisons.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-end gap-2">
                  {comparisons.slice(0,3).map((c, idx) => (
                    <span key={idx} className={`px-2 py-1 rounded-full bg-muted/10 text-muted-foreground`}> 
                      {c.provider}: {formatPriceINR(c.price)}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 items-center text-sm">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{formatTime(flight.departureTime)}</p>
          <p className="text-xs text-muted-foreground font-medium">{flight.from || 'DEP'}</p>
        </div>
        <div className="text-center">
            <div className="flex items-center justify-center mb-1">
            <div className="flex-1 h-px bg-border"></div>
            <div className={`mx-2 p-1 rounded-full ${airlineColors.light}`}>
              <svg className={`w-4 h-4 ${airlineColors.text}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {formatDuration(flight.durationMins)}
          </p>
          <p className="text-xs text-muted-foreground">
            {(flight.stops === 0 || flight.stops === undefined) ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
          {flight.stopovers && flight.stopovers.length > 0 && (
            <div className="mt-1">
              {flight.stopovers.map((stopover, idx) => (
                <p key={idx} className="text-xs text-orange-600 font-medium">
                  via {stopover.airport} ({Math.floor(stopover.duration / 60)}h {stopover.duration % 60}m)
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{formatTime(flight.arrivalTime)}</p>
          <p className="text-xs text-muted-foreground font-medium">{flight.to || 'ARR'}</p>
        </div>
      </div>
      
      {/* Enhanced stopover details section */}
      {flight.stopovers && flight.stopovers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-foreground">Stopover Details</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {flight.stopovers.map((stopover, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Stop {idx + 1}: {stopover.airport}</span>
                <span className="font-medium text-orange-600">
                  {Math.floor(stopover.duration / 60)}h {stopover.duration % 60}m layover
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.button>
  )
}
