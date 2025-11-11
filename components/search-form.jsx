"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Airport/City data
const airports = [
  // Indian Cities
  { code: "DEL", city: "Delhi", country: "India" },
  { code: "BOM", city: "Mumbai", country: "India" },
  { code: "MAA", city: "Chennai", country: "India" },
  { code: "BLR", city: "Bangalore", country: "India" },
  { code: "HYD", city: "Hyderabad", country: "India" },
  { code: "CCU", city: "Kolkata", country: "India" },
  { code: "PNQ", city: "Pune", country: "India" },
  { code: "AMD", city: "Ahmedabad", country: "India" },
  { code: "GOI", city: "Goa", country: "India" },
  { code: "COK", city: "Kochi", country: "India" },
  
  // International Cities
  { code: "DXB", city: "Dubai", country: "UAE" },
  { code: "DOH", city: "Doha", country: "Qatar" },
  { code: "SIN", city: "Singapore", country: "Singapore" },
  { code: "LHR", city: "London", country: "UK" },
  { code: "JFK", city: "New York", country: "USA" },
  { code: "LAX", city: "Los Angeles", country: "USA" },
  { code: "CDG", city: "Paris", country: "France" },
  { code: "FRA", city: "Frankfurt", country: "Germany" },
  { code: "BKK", city: "Bangkok", country: "Thailand" },
  { code: "HKG", city: "Hong Kong", country: "Hong Kong" }
]

export default function SearchForm() {
  const router = useRouter()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [depart, setDepart] = useState("")
  const [ret, setRet] = useState("")
  const [pax, setPax] = useState(1)
  const [flightClass, setFlightClass] = useState("economy")
  const [errors, setErrors] = useState({})

  function validate() {
    const newErrors = {}
    
    if (!from) newErrors.from = "Please select departure city"
    if (!to) newErrors.to = "Please select destination city"  
    if (!depart) newErrors.depart = "Please select departure date"
    if (from === to) newErrors.to = "Destination must be different from departure"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function submit(e) {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    const qs = new URLSearchParams({
      from,
      to,
      depart: depart,
      return: ret,
      pax: String(pax),
      class: flightClass,
    }).toString()
    router.push(`/search?${qs}`)
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-white">From *</label>
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className={`w-full rounded-md border ${errors.from ? 'border-red-500' : 'border-white/30'} bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50`}
          required
        >
          <option value="" className="text-black">Select departure city</option>
          {airports.map((airport) => (
            <option key={airport.code} value={airport.code} className="text-black">
              {airport.city} ({airport.code})
            </option>
          ))}
        </select>
        {errors.from && <p className="mt-1 text-xs text-red-400">{errors.from}</p>}
      </div>
      
      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-white">To *</label>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={`w-full rounded-md border ${errors.to ? 'border-red-500' : 'border-white/30'} bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50`}
          required
        >
          <option value="" className="text-black">Select destination city</option>
          {airports.map((airport) => (
            <option key={airport.code} value={airport.code} className="text-black">
              {airport.city} ({airport.code})
            </option>
          ))}
        </select>
        {errors.to && <p className="mt-1 text-xs text-red-400">{errors.to}</p>}
      </div>
      
      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-white">Departure *</label>
        <input
          type="date"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className={`w-full rounded-md border ${errors.depart ? 'border-red-500' : 'border-white/30'} bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]`}
          required
        />
        {errors.depart && <p className="mt-1 text-xs text-red-400">{errors.depart}</p>}
      </div>
      
      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-white">Return</label>
        <input
          type="date"
          value={ret}
          onChange={(e) => setRet(e.target.value)}
          min={depart || new Date().toISOString().split('T')[0]}
          className="w-full rounded-md border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
        />
      </div>
      
      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-white">Passengers</label>
        <select
          value={pax}
          onChange={(e) => setPax(Number(e.target.value))}
          className="w-full rounded-md border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <option key={num} value={num} className="text-black">{num} passenger{num > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      
      <div className="md:col-span-1">
        <label className="mb-1 block text-sm font-medium text-white">Class</label>
        <select
          value={flightClass}
          onChange={(e) => setFlightClass(e.target.value)}
          className="w-full rounded-md border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <option value="economy" className="text-black">Economy Class</option>
          <option value="premium" className="text-black">Premium Economy</option>
          <option value="business" className="text-black">Business Class</option>
          <option value="first" className="text-black">First Class</option>
        </select>
      </div>
      
      <div className="md:col-span-6">
        <button 
          type="submit"
          className="w-full rounded-md bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3 text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        >
          Search Flights
        </button>
      </div>
    </form>
  )
}
