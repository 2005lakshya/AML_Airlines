"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import Footer from "@/components/footer"

export default function AuthPage() {
  const [mode, setMode] = useState("login")
  const router = useRouter()
  const search = useSearchParams()

  // If already signed in, send user away from /auth immediately.
  useEffect(() => {
    if (typeof window === "undefined") return
    const existing = localStorage.getItem("user")
    if (existing) {
      const next = search.get("next")
      router.replace(next || "/profile")
    }
  }, [router, search])

  return (
    <div className="min-h-screen bg-black flex flex-col pt-24">
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <button className="text-sm underline text-white/80 hover:text-white transition-colors" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </div>

          <div className="grid gap-3">
            <a href="/api/auth/oidc/login" className="rounded-md bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors px-4 py-2.5 font-medium text-center">Continue with AWS Cognito</a>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
