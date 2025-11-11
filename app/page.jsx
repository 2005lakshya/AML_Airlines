"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Footer from "@/components/footer"
import SearchForm from "@/components/search-form"
import AnimatedPlaneLoader from "@/components/animated-plane-loader"
import PopularDestinations from "@/components/popular-destinations"
import PopularRoutes from "@/components/popular-routes"
import LiveFlightFeed from "@/components/live-flight-feed"
import Galaxy from "@/components/Galaxy/Galaxy"

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">{/* Galaxy background - fixed for entire page */}
      <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0, backgroundColor: '#000000' }}>
        <Galaxy 
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0}
          hueShift={240}
        />
      </div>

      <section className="relative isolate flex flex-col items-center justify-center px-6 pt-32 pb-16 md:pt-40 md:pb-20" style={{ zIndex: 1 }}>
        <div className="mx-auto w-full max-w-5xl space-y-10 text-center">
          <motion.h1
            className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            Fly smarter with our premium airline portal
          </motion.h1>
          <motion.p
            className="mx-auto max-w-2xl text-pretty text-white/80"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 120, damping: 16 }}
          >
            Search, compare, and book the best flights. Earn loyalty points, manage your trips, and unlock exclusive
            rewards.
          </motion.p>

          {/* Glassmorphism search panel */}
          <motion.div
            className="mx-auto w-full max-w-4xl rounded-xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-6"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 140, damping: 18 }}
          >
            <SearchForm />
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, type: "spring", stiffness: 140, damping: 18 }}
          >
            <Link
              href="/live-tracking"
              className="rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 transition-all shadow-lg hover:shadow-xl"
            >
              Live Tracking
            </Link>
            <Link
              href="/manage"
              className="rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 transition-all shadow-lg hover:shadow-xl"
            >
              Manage Booking
            </Link>
            <Link
              href="/offers"
              className="rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/20 transition-all shadow-lg hover:shadow-xl"
            >
              Offers
            </Link>
            <Link
              href="/loyalty"
              className="rounded-full bg-white/15 backdrop-blur-xl border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/25 transition-all shadow-lg hover:shadow-xl"
            >
              Join Loyalty Program
            </Link>
          </motion.div>
        </div>
      </section>

      {/* New sections added below hero */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PopularDestinations />
        <PopularRoutes />
        <LiveFlightFeed />
        <Footer />
      </div>
    </div>
  )
}
