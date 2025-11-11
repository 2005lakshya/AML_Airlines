"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import Footer from "@/components/footer"
import FlightCard from "@/components/flight-card"

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function SearchResultsPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [sort, setSort] = useState("recommended")
  const [filters, setFilters] = useState({
    maxPrice: "",
    stops: "any",
    airline: "any",
    departure: "any",
  })

  const query = new URLSearchParams({
    from: params.get("from") || "",
    to: params.get("to") || "",
    date: params.get("depart") || "",
    return: params.get("return") || "",
    pax: params.get("pax") || "1",
    class: params.get("class") || "economy",
  }).toString()

  const { data, isLoading, error } = useSWR(`/api/flights?${query}`, fetcher)

  const flights = useMemo(() => {
    let list = (data?.flights || []).slice()

    // Apply filters
    if (filters.maxPrice) {
      const lim = Number(filters.maxPrice)
      list = list.filter((f) => f.price <= lim)
    }
    if (filters.stops !== "any") {
      const s = Number(filters.stops)
      list = list.filter((f) => f.stops === s)
    }
    if (filters.airline !== "any") {
      list = list.filter((f) => f.airline.toLowerCase() === filters.airline)
    }
    if (filters.departure !== "any") {
      const window = filters.departure // morning/afternoon/evening/night
      list = list.filter((f) => {
        const hour = Number(f.departureTime.split(":")[0])
        if (window === "morning") return hour >= 5 && hour < 12
        if (window === "afternoon") return hour >= 12 && hour < 17
        if (window === "evening") return hour >= 17 && hour < 21
        if (window === "night") return hour >= 21 || hour < 5
        return true
      })
    }

    // Sort
    if (sort === "cheapest") list.sort((a, b) => a.price - b.price)
    if (sort === "fastest") list.sort((a, b) => a.durationMins - b.durationMins)
    // recommended = mixed heuristic; for demo we keep original order
    return list
  }, [data, sort, filters])

  return (
  <div className="min-h-dvh flex flex-col bg-gradient-to-br from-black via-zinc-900/90 to-zinc-800/90">
      {/* Navbar is already rendered in app/layout.jsx */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-28 pb-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 shadow-lg backdrop-blur-xl p-6">
            <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white">Search Results</h1>
                <p className="text-zinc-300">
                  {params.get("from") || "Origin"} → {params.get("to") || "Destination"} • {params.get("pax") || 1} passenger(s)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-zinc-200">Sort</label>
                <select
                  className="rounded-md border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort results"
                >
                  <option value="recommended">Recommended</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="fastest">Fastest</option>
                </select>
              </div>
            </header>
          </div>
          {/* Filters Section */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 shadow-lg backdrop-blur-xl p-6">
            <aside className="grid grid-cols-2 gap-3 md:flex md:flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-200">Max Price</label>
                <input
                  type="number"
                  min="0"
                  className="w-28 rounded-md border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((s) => ({ ...s, maxPrice: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-200">Stops</label>
                <select
                  className="rounded-md border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm"
                  value={filters.stops}
                  onChange={(e) => setFilters((s) => ({ ...s, stops: e.target.value }))}
                >
                  <option value="any">Any</option>
                  <option value="0">Non-stop</option>
                  <option value="1">1 Stop</option>
                  <option value="2">2 Stops</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-200">Airline</label>
                <select
                  className="rounded-md border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm"
                  value={filters.airline}
                  onChange={(e) => setFilters((s) => ({ ...s, airline: e.target.value }))}
                >
                  <option value="any">Any</option>
                  <option value="aerojet">AeroJet</option>
                  <option value="skyline">Skyline</option>
                  <option value="blueair">BlueAir</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-200">Departure</label>
                <select
                  className="rounded-md border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm"
                  value={filters.departure}
                  onChange={(e) => setFilters((s) => ({ ...s, departure: e.target.value }))}
                >
                  <option value="any">Any</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </aside>
          </div>
          {/* Results Section */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 shadow-lg backdrop-blur-xl p-6">
            <div aria-live="polite">
          {isLoading ? (
            <div className="rounded-lg border border-border/60 bg-background/60 p-8 text-center backdrop-blur">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p>Searching for flights...</p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a few moments
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/60 bg-background/60 p-8 text-center backdrop-blur">
              <div className="text-destructive mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-lg font-medium">Unable to load flights</p>
              </div>
              <p className="text-muted-foreground mb-4">
                {data?.error || "There was an issue connecting to the flight booking service. Please try again later."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : flights.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-background/60 p-8 text-center backdrop-blur">
              <div className="text-muted-foreground mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">No flights found</p>
              </div>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to see more results.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setFilters({ maxPrice: "", stops: "any", airline: "any", departure: "any" })}
                  className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  New Search
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-white font-semibold">
                Found {flights.length} flight{flights.length !== 1 ? 's' : ''} • {data?.isDemo ? 'Demo data' : 'Live results'}
              </div>
              <ul className="grid grid-cols-1 gap-4">
                {flights.map((f, i) => (
                  <li key={f.id}>
                    <FlightCard 
                      flight={f} 
                      index={i} 
                      onSelect={() => {
                        // Store flight data in localStorage for the detail page
                        localStorage.setItem('selectedFlight', JSON.stringify(f))
                        router.push(`/flight/${encodeURIComponent(f.id)}?pax=${params.get("pax") || "1"}`)
                      }} 
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
