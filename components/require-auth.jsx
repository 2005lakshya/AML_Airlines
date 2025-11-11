"use client"

import { useAuth } from "@/contexts/auth-context"
import SignUpButton from "@/components/signup-button"
import Footer from "@/components/footer"

export default function RequireAuth({ children, fallback }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col pt-24">
        <div className="flex-1 grid place-items-center">
          <div className="text-sm text-white/70">Checking access…</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen bg-black flex flex-col pt-24">
          <div className="flex-1 grid place-items-center px-4">
            <div className="w-full max-w-md rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-center">
              <h2 className="mb-3 text-2xl font-semibold text-white">Please sign in to continue</h2>
              <p className="mb-6 text-sm text-white/70">
                You need an account to access Loyalty, Manage Booking, or Profile.
              </p>
              <SignUpButton 
                variant="outline"
                className="w-full inline-flex items-center justify-center rounded-md bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Sign Up / Sign In
              </SignUpButton>
            </div>
          </div>
          <Footer />
        </div>
      )
    )
  }

  return <>{children}</>
}
