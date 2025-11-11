"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "../../lib/auth"
import Footer from "@/components/footer"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/loyalty"

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.")
      return
    }
    signIn(email)
    router.replace(next)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col pt-24">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-3xl font-bold text-white text-center">Sign in</h1>
          <form onSubmit={handleSubmit} className="rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6">
            <label className="block text-sm font-medium mb-2 text-white">Email</label>
            <input
              className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              className="mt-6 w-full inline-flex items-center justify-center rounded-md bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2.5 font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
