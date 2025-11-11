"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url) => fetch(url).then((r) => r.json())

// Helper function to format price in Indian Rupees
const formatPriceINR = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

export default function LiveFlightFeed() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Always use next day's date for fetch and display
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const yyyy = tomorrow.getFullYear()
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`
  const { data, error, isLoading } = useSWR(`/api/flights?date=${dateStr}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const flights = data?.flights || []
  const FLIGHTS_PER_VIEW = 5
  
  // Auto-scroll animation
  useEffect(() => {
    if (flights.length <= FLIGHTS_PER_VIEW) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, flights.length - FLIGHTS_PER_VIEW)
        return prevIndex >= maxIndex ? 0 : prevIndex + 1
      })
    }, 3000) // Change every 3 seconds
    
    return () => clearInterval(interval)
  }, [flights.length])

  // Get visible flights based on current index
  const visibleFlights = flights.slice(currentIndex, currentIndex + FLIGHTS_PER_VIEW)

  return (
    <section aria-labelledby="live-flight-feed-heading" className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 id="live-flight-feed-heading" className="text-pretty text-2xl font-semibold text-white">
            Live fares and flights
          </h2>
          <div className="text-sm text-white/70">Showing for: <span className="font-medium">{dateStr}</span></div>
        </div>
        <p className="text-sm text-white/70">Auto-refreshes every 30 seconds</p>
      </div>

      <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between text-white">
            Trending flights
            {flights.length > FLIGHTS_PER_VIEW && (
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(flights.length / FLIGHTS_PER_VIEW) }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                      Math.floor(currentIndex / FLIGHTS_PER_VIEW) === i ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full bg-white/20" />
              <Skeleton className="h-6 w-3/4 bg-white/20" />
              <Skeleton className="h-6 w-2/3 bg-white/20" />
              <Skeleton className="h-6 w-1/2 bg-white/20" />
              <Skeleton className="h-6 w-3/5 bg-white/20" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">Unable to load flights right now.</p>
          ) : (
            <div className="overflow-hidden">
              <ul 
                className="divide-y divide-white/20 transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateY(0px)`,
                  minHeight: `${FLIGHTS_PER_VIEW * 60}px` // Approximate height per flight item
                }}
              >
                {visibleFlights.map((f, index) => (
                  <li 
                    key={`${f.id}-${currentIndex}-${index}`} 
                    className="flex items-center justify-between py-3 animate-in fade-in duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 text-sm font-medium text-white">{f.airline}</span>
                      <span className="truncate text-sm text-white/70">{f.number}</span>
                      <span className="truncate text-sm text-white/70">
                        {f.from} → {f.to}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="text-sm text-white/70">
                        {f.stops === 0 ? "Nonstop" : `${f.stops}-stop`}
                      </span>
                      <span className="text-sm font-medium text-white">{formatPriceINR(f.price)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
