"use client"

import RequireAuth from "@/components/require-auth"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Footer from "@/components/footer"

export default function ManagePage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-black flex flex-col pt-24">
        <div className="max-w-4xl mx-auto px-4 py-6 flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Manage Booking</h1>
            <p className="text-white/70">View, cancel, reschedule, or download your boarding pass.</p>
          </div>
          <ManageInner />
        </div>
        <Footer />
      </div>
    </RequireAuth>
  )
}
//idk

function ManageInner() {
  const [pnr, setPnr] = useState("")
  const [results, setResults] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function search() {
    setLoading(true)
    setError("")
    setResults([])
    try {
      // Search by PNR number using correct API
      let res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pnr })
      })
      let data = await res.json()
      if (data.success && data.booking) {
        setResults([data.booking])
      } else {
        setError("No bookings found for this PNR number.")
      }
    } catch (err) {
      setError("Failed to fetch bookings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            placeholder="Enter PNR Number"
            className="rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            value={pnr}
            onChange={(e) => setPnr(e.target.value)}
          />
          <button
            onClick={search}
            className="rounded-md bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {results.map((b) => (
          <li key={b.BookingID}>
            <motion.div
              layout
              className="w-full rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-left cursor-pointer"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              onClick={() => setExpanded(expanded === b.BookingID ? null : b.BookingID)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-lg">{b.Origin} → {b.Destination}</p>
                  <p className="text-sm text-white/70 mt-1">
                    Booking Ref: {b.BookingReference} • PNR: {b.PNR} • {b.GuestEmail}
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    Date: {b.BookingDate ? new Date(b.BookingDate).toLocaleDateString() : ""} • Status: {b.PaymentStatus}
                  </p>
                </div>
                <span className="text-sm text-white font-medium">{b.airlineName || b.FlightNo}</span>
              </div>
              <AnimatePresence>
                {expanded === b.BookingID && (
                  <motion.div
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 160, damping: 20 }}
                    className="mt-4"
                  >
                    <div className="mb-2 text-white/80">
                      <div><b>Passenger(s):</b> {b.passengers && b.passengers.length > 0 ? b.passengers.map(p => `${p.FirstName} ${p.LastName}`).join(", ") : "-"}</div>
                      <div><b>Flight No:</b> {b.FlightNo}</div>
                      <div><b>Travel Date:</b> {b.TravelDate ? new Date(b.TravelDate).toLocaleDateString() : "-"}</div>
                      <div><b>Departure:</b> {b.DepartureTime ? new Date(b.DepartureTime).toLocaleString() : "-"}</div>
                      <div><b>Arrival:</b> {b.ArrivalTime ? new Date(b.ArrivalTime).toLocaleString() : "-"}</div>
                      <div><b>Seat(s):</b> {b.passengers && b.passengers.length > 0 ? b.passengers.map(p => p.SeatNumber || "-").join(", ") : "-"}</div>
                      <div><b>Meal(s):</b> {b.passengers && b.passengers.length > 0 ? b.passengers.map(p => p.MealType || "-").join(", ") : "-"}</div>
                      <div><b>Total Price:</b> ₹{b.TotalPrice}</div>
                      <div><b>Status:</b> {b.PaymentStatus}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <button className="rounded-md bg-white/10 hover:bg-white/20 border border-white/30 px-3 py-2.5 text-sm text-white font-medium transition-colors">
                        View Ticket
                      </button>
                      <button className="rounded-md bg-white/10 hover:bg-white/20 border border-white/30 px-3 py-2.5 text-sm text-white font-medium transition-colors">
                        Reschedule
                      </button>
                      <button className="rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 px-3 py-2.5 text-sm text-red-300 font-medium transition-colors">
                        Cancel Flight
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </li>
        ))}
      </ul>
    </section>
  )
}
