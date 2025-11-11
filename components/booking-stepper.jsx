"use client"

import { motion } from "framer-motion"

export default function BookingStepper({ step = 0, steps = [] }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <div key={label} className="flex items-center gap-3">
            <motion.div
              className={`grid h-8 w-8 place-items-center rounded-full border text-xs text-white ${
                active
                  ? "border-[var(--airline-color,#0ea5e9)] bg-white/10"
                  : done
                    ? "border-[var(--airline-color,#0ea5e9)]/60 bg-white/10"
                    : "border-border bg-white/5"
              }`}
              layout
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              {i + 1}
            </motion.div>
            <span className={`text-sm text-white ${active ? "font-medium" : "opacity-70"}`}>{label}</span>
            {i !== steps.length - 1 && <div className="h-px w-8 bg-[var(--airline-color,#0ea5e9)]/30" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}
