"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ROUTES = [
  { from: "SFO", to: "JFK", label: "San Francisco ↔ New York" },
  { from: "SEA", to: "LAX", label: "Seattle ↔ Los Angeles" },
  { from: "ORD", to: "MIA", label: "Chicago ↔ Miami" },
  { from: "DFW", to: "BOS", label: "Dallas ↔ Boston" },
  { from: "DEN", to: "ATL", label: "Denver ↔ Atlanta" },
  { from: "PHX", to: "IAD", label: "Phoenix ↔ Washington DC" },
]

export default function PopularRoutes() {
  return (
    <section aria-labelledby="popular-routes-heading" className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-end justify-between">
        <h2 id="popular-routes-heading" className="text-pretty text-2xl font-semibold text-white">
          Popular flight routes
        </h2>
        <p className="text-sm text-white/70">Quick links to common city pairs</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROUTES.map((r) => (
          <Card key={`${r.from}-${r.to}`} className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:bg-white/15 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">{r.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Search fares from {r.from} to {r.to}
              </p>
              <Button asChild size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Link href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}>Search</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
