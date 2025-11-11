"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

export default function LoyaltyStats({ points = 0, tier = "Silver", showDetailed = false }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v))
  const [animatedTier, setAnimatedTier] = useState(tier)

  const tierInfo = {
    Bronze: { color: "bg-amber-600", textColor: "text-amber-600", nextPoints: 2000 },
    Silver: { color: "bg-gray-400", textColor: "text-gray-600", nextPoints: 5000 },
    Gold: { color: "bg-yellow-500", textColor: "text-yellow-600", nextPoints: 10000 },
    Platinum: { color: "bg-purple-600", textColor: "text-purple-600", nextPoints: null }
  }

  const currentTierInfo = tierInfo[tier] || tierInfo.Silver
  const nextTierName = {
    Bronze: "Silver",
    Silver: "Gold", 
    Gold: "Platinum",
    Platinum: null
  }[tier]

  useEffect(() => {
    const controls = animate(mv, points, { duration: 0.8, ease: "easeOut" })
    setAnimatedTier(tier)
    return () => controls.stop()
  }, [points, tier])

  if (showDetailed) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Available Points</p>
            <motion.p className="text-3xl font-bold text-primary">{rounded}</motion.p>
          </div>
          <div className={`${currentTierInfo.color} text-white px-4 py-2 rounded-full font-semibold text-sm`}>
            {animatedTier}
          </div>
        </div>

        {nextTierName && currentTierInfo.nextPoints && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress to {nextTierName}</span>
              <span className="text-sm text-muted-foreground">
                {points} / {currentTierInfo.nextPoints}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${currentTierInfo.color}`}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min((points / currentTierInfo.nextPoints) * 100, 100)}%` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.max(0, currentTierInfo.nextPoints - points)} points to {nextTierName}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Redeem Points
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border border-border rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Earn More
          </motion.button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-green-600">12</p>
              <p className="text-xs text-muted-foreground">Flights This Year</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">₹85,400</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">2,150</p>
              <p className="text-xs text-muted-foreground">Points Earned</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Total Points</p>
        <motion.p className="text-4xl font-bold text-primary">{rounded}</motion.p>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Current Tier</p>
        <div className={`inline-flex items-center gap-2 ${currentTierInfo.color} text-white px-4 py-2 rounded-full font-semibold`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
          </svg>
          {animatedTier}
        </div>
      </div>

      {nextTierName && currentTierInfo.nextPoints && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Progress to {nextTierName}</span>
            <span className="text-xs text-muted-foreground">
              {Math.max(0, currentTierInfo.nextPoints - points)} left
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${currentTierInfo.color}`}
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min((points / currentTierInfo.nextPoints) * 100, 100)}%` 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <button className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        View Rewards
      </button>
      
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Member since {new Date().getFullYear() - 1}
        </p>
      </div>
    </div>
  )
}
