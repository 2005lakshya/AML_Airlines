"use client"


export function getUser() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem('user_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function signIn(email, userData = {}) {
  if (typeof window === "undefined") return
  const session = {
    email,
    ...userData,
    signedInAt: new Date().toISOString()
  }
  localStorage.setItem('user_session', JSON.stringify(session))
}

export function signOut() {
  if (typeof window === "undefined") return
  localStorage.removeItem('user_session')
}

export function getNextUrl(searchParams) {
  const next = searchParams?.get?.("next")
  return next && next.startsWith("/") ? next : "/"
}
