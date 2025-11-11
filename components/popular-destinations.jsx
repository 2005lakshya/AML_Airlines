"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DESTINATIONS = [
  { city: "New York", code: "JFK", query: "new york skyline at dusk" },
  { city: "Los Angeles", code: "LAX", query: "los angeles skyline palm trees" },
  { city: "London", code: "LHR", query: "london skyline big ben" },
  { city: "Tokyo", code: "HND", query: "tokyo skyline night neon" },
  { city: "Paris", code: "CDG", query: "paris eiffel tower skyline" },
  { city: "Dubai", code: "DXB", query: "dubai skyline marina" },
]

export default function PopularDestinations() {
  return (
    <section aria-labelledby="popular-destinations-heading" className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 id="popular-destinations-heading" className="text-pretty text-2xl font-semibold text-white">
          Popular destinations
        </h2>
        <p className="text-sm text-white/70">Hand-picked cities frequently searched by travelers</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((d) => (
          <Card key={d.code} className="overflow-hidden bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:bg-white/15 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-baseline justify-between">
                <span className="text-lg text-white">{d.city}</span>
                <span className="text-sm font-normal text-white/70">{d.code}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative h-28 w-full overflow-hidden rounded-md border border-white/20">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-1">✈️</div>
                    <div className="text-xs text-white/70">{d.city}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Explore fares to {d.city}</p>
                <Link
                  href={`/search?to=${encodeURIComponent(d.code)}`}
                  className="text-sm font-medium text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Search
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
