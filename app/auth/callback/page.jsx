"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const search = useSearchParams()

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch('/api/auth/oidc/me', { cache: 'no-store' })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'No session')
        const u = json.user || {}
        const normalized = {
          id: u.sub || u.username || u.user_id || undefined,
          name: u.name || u.preferred_username || u.email,
          email: u.email,
          raw: u,
          provider: 'cognito'
        }
        localStorage.setItem('user_session', JSON.stringify(normalized))
        const next = (document.cookie.split('; ').find(c => c.startsWith('post_login_next=')) || '').split('=')[1]
        const nextUrl = next ? decodeURIComponent(next) : '/profile'
        if (!cancelled) router.replace(nextUrl)
      } catch (err) {
        if (!cancelled) router.replace('/auth?error=signin')
      }
    }
    run()
    return () => { cancelled = true }
  }, [router, search])

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-black">
      <div className="text-center opacity-80">Signing you in…</div>
    </div>
  )
}
