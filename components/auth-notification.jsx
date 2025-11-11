"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

export default function AuthNotification() {
  const { user, isAuthenticated } = useAuth()
  const [showNotification, setShowNotification] = useState(false)
  const [lastUser, setLastUser] = useState(null)

  useEffect(() => {
    // Show notification when user logs in
    if (isAuthenticated && user && !lastUser) {
      setShowNotification(true)
      setLastUser(user)
      
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 20000)
      
      return () => clearTimeout(timer)
    }
    
    // Show notification when user logs out
    if (!isAuthenticated && lastUser) {
      setShowNotification(true)
      setLastUser(null)
      
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 20000)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, lastUser])

  if (!showNotification) return null

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-4 flex items-center gap-3 text-white">
        {isAuthenticated ? (
          <>
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Welcome back!</p>
              <p className="text-xs text-white/70">Signed in as {user?.name || user?.email}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Signed out</p>
              <p className="text-xs text-white/70">You've been signed out successfully</p>
            </div>
          </>
        )}
        <button
          onClick={() => setShowNotification(false)}
          className="ml-auto text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}