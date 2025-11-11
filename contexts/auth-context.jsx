"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { queryDatabase } from '@/lib/auth-utils'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing session on app load
  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      setLoading(true)
      
      // First, check for OIDC session (Cognito)
      try {
        const oidcResp = await fetch('/api/auth/oidc/me', { credentials: 'include' })
        if (oidcResp.ok) {
          const data = await oidcResp.json()
          // Handle both formats: { success: true, user: {...} } or direct user object
          const oidcUser = data.user || data
          if (oidcUser && oidcUser.email) {
            const nameParts = (oidcUser.name || '').split(' ')
            setUser({
              id: oidcUser.sub,
              email: oidcUser.email,
              name: oidcUser.name || oidcUser.email.split('@')[0],
              firstName: oidcUser.given_name || nameParts[0] || '',
              lastName: oidcUser.family_name || nameParts.slice(1).join(' ') || '',
              ...oidcUser
            })
            setLoading(false)
            return
          }
        }
      } catch (oidcErr) {
        console.debug('No OIDC session found, checking localStorage')
      }

      // Fallback: Check localStorage for legacy session
      const session = localStorage.getItem('user_session')
      if (session) {
        const userData = JSON.parse(session)
        // If session only contains minimal info (no raw DB fields), fetch full profile
        if (userData && userData.email && !userData.raw && !userData.PhoneNumber) {
          try {
            const resp = await queryDatabase('/api/users', { email: userData.email })
            if (resp && resp.success && resp.user) {
              const u = resp.user
              const normalized = {
                id: u.UserID || u.userid || userData.id,
                name: u.FullName || u.Name || u.name || userData.name,
                email: u.Email || u.email || userData.email,
                ...u
              }
              localStorage.setItem('user_session', JSON.stringify(normalized))
              setUser(normalized)
            } else {
              setUser(userData)
            }
          } catch (err) {
            console.warn('Failed to refresh session profile:', err)
            setUser(userData)
          }
        } else {
          // already has full data
          setUser(userData)
        }
      }
    } catch (err) {
      console.error('Session check failed:', err)
      localStorage.removeItem('user_session')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('user_session')
    setUser(null)
    setError(null)
    // Redirect to OIDC logout to clear Cognito session
    window.location.href = '/api/auth/oidc/logout'
  }

  const value = {
    user,
    loading,
    error,
    logout,
    setUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}