"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"

export default function AuthModal() {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState("login")
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  })
  const [formErrors, setFormErrors] = React.useState({})
  const [showSuccess, setShowSuccess] = React.useState(false)
  
  // const { login, signup, loading, error } = useAuth()

  // expose opener globally so any link can trigger without rewriting nav
  React.useEffect(() => {
    window.__openAuthModal = (nextMode) => {
      if (nextMode) setMode(nextMode)
      setOpen(true)
      // Reset form when opening
      setFormData({ email: "", password: "", firstName: "", lastName: "" })
      setFormErrors({})
      setShowSuccess(false)
    }
    return () => {
      if (window.__openAuthModal) delete window.__openAuthModal
    }
  }, [])

  function validateForm() {
    const errors = {}
    
    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format"
    }
    
    if (!formData.password) {
      errors.password = "Password is required"
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }
    
    if (mode === "signup" && !formData.firstName) {
      errors.firstName = "First name is required"
    }
    if (mode === "signup" && !formData.lastName) {
      errors.lastName = "Last name is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      // let result
      // if (mode === "login") {
      //   result = await login(formData.email, formData.password)
      // } else {
      //   result = await signup(formData.email, formData.password, `${formData.firstName} ${formData.lastName}`)
      // }
      
      // if (result.success) {
        // Show success message briefly before closing
        setShowSuccess(true)
        
        // Close modal after a short delay to show success feedback
        setTimeout(() => {
          setOpen(false)
          setFormData({ email: "", password: "", firstName: "", lastName: "" })
          setFormErrors({})
          setShowSuccess(false)
        }, 1200) // 1.2 seconds to show success message
      // }
    } catch (err) {
      console.error("Auth error:", err)
    }
  }

  function handleInputChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* subtle airline background inside modal */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <svg aria-hidden="true" viewBox="0 0 500 200" className="h-full w-full">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity="0.10" />
                <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#sky)"></rect>
            <g className="plane-track">
              <path d="M10,50 L490,50" stroke="currentColor" strokeOpacity="0.15" />
              <path d="M10,100 L490,100" stroke="currentColor" strokeOpacity="0.10" />
              <path d="M10,150 L490,150" stroke="currentColor" strokeOpacity="0.06" />
            </g>
            <g className="animate-[plane-move_14s_linear_infinite] text-muted-foreground">
              <path d="M0 100 l20 0 l5 -5 l-10 0 l0 -5 l10 0 l-5 -5 l-20 0 z" fill="currentColor" />
            </g>
          </svg>
          <style
            // define keyframes locally to avoid touching globals.css
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes plane-move { 
                  0% { transform: translateX(-10%); } 
                  100% { transform: translateX(110%); } 
                }
              `,
            }}
          />
        </div>

        <DialogHeader className="relative">
          <DialogTitle className="text-balance">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative z-10 mt-2">
          <div className="mb-4 inline-flex rounded-md border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded px-3 py-1.5 text-sm ${mode === "login" ? "bg-primary text-primary-foreground" : "text-foreground"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded px-3 py-1.5 text-sm ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-foreground"}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            {showSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode === "login" ? "Login successful! Redirecting..." : "Account created successfully!"}
              </div>
            )}

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm text-foreground">
                  First Name
                  <input
                    required
                    type="text"
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${formErrors.firstName ? 'border-destructive' : 'border-input bg-background'}`}
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                  {formErrors.firstName && (
                    <span className="text-xs text-destructive mt-1">{formErrors.firstName}</span>
                  )}
                </label>
                <label className="text-sm text-foreground">
                  Last Name
                  <input
                    required
                    type="text"
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${formErrors.lastName ? 'border-destructive' : 'border-input bg-background'}`}
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                  {formErrors.lastName && (
                    <span className="text-xs text-destructive mt-1">{formErrors.lastName}</span>
                  )}
                </label>
              </div>
            )}
            
            <label className="text-sm text-foreground">
              Email
              <input
                required
                type="email"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${
                  formErrors.email ? 'border-destructive' : 'border-input bg-background'
                }`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              {formErrors.email && (
                <span className="text-xs text-destructive mt-1">{formErrors.email}</span>
              )}
            </label>
            
            <label className="text-sm text-foreground">
              Password
              <input
                required
                type="password"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${
                  formErrors.password ? 'border-destructive' : 'border-input bg-background'
                }`}
                placeholder={mode === "login" ? "Your password" : "Choose a password (min 6 characters)"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              {formErrors.password && (
                <span className="text-xs text-destructive mt-1">{formErrors.password}</span>
              )}
            </label>

            {/* {error && (
              <div className="p-2 text-xs text-destructive bg-destructive/10 rounded border border-destructive/20">
                {error}
              </div>
            )} */}

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {mode === "login" ? "No account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="underline underline-offset-4 hover:no-underline text-primary"
                >
                  {mode === "login" ? "Sign up" : "Login"}
                </button>
              </div>
              <Button type="submit" size="sm" disabled={showSuccess}>
                {showSuccess 
                  ? "Success!" 
                  : mode === "login" ? "Login" : "Create account"
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
