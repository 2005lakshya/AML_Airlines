"use client"

import { motion } from "framer-motion"

export default function AnimatedPlaneLoader({ label = "Searching flights" }) {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        initial={{ x: -10 }}
        animate={{ x: 10 }}
        transition={{ repeat: Number.POSITIVE_INFINITY, repeatType: "mirror", duration: 0.8, ease: "easeInOut" }}
        aria-hidden="true"
      >
        ✈️
      </motion.span>
      <span className="text-sm text-muted-foreground">{label}...</span>
    </div>
  )
}
