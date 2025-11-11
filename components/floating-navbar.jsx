"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import SignUpButton from "@/components/signup-button"
import { useAuth } from "@/contexts/auth-context"

export default function FloatingNavbar() {
  const { user, logout, isAuthenticated, loading, setUser } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "User"
    return user.name || user.email?.split('@')[0] || "User"
  }

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            const u = data.user || {}
            const normalized = { ...u, email: u.email || u.Email || u.EmailAddress, name: u.name || u.Name }
            setUser((prev) => ({ ...prev, ...normalized }));
          }
        })
        .catch((err) => console.error("Failed to fetch user data:", err));
    }
  }, [isAuthenticated, user?.email]);

  return (
    <motion.nav 
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex items-center justify-between px-6 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <img src="/aml.jpg" alt="AML Airways Logo" className="h-8 w-8 rounded" />
          <span>AML Airways</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-white/90 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/offers" className="text-sm text-white/90 hover:text-white transition-colors">
            Offers
          </Link>
          <Link href="/loyalty" className="text-sm text-white/90 hover:text-white transition-colors">
            Loyalty
          </Link>
          <Link href="/profile" className="text-sm text-white/90 hover:text-white transition-colors">
            Profile
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-transparent"></div>
          ) : isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline">Welcome, {getUserDisplayName()}</span>
                <svg 
                  className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-white/20">
                      <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-white/70">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/loyalty"
                      className="block px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Loyalty Points
                    </Link>
                    <div className="border-t border-white/20">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-sm text-white/90 hover:text-red-400 hover:bg-white/10"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                  {/* Click outside to close menu */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                </>
              )}
            </div>
          ) : (
            <SignUpButton />
          )}
        </div>
      </div>
    </motion.nav>
  )
}
