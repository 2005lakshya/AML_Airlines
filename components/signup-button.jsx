"use client"

export default function SignupButton({ className = '', children, variant }) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/oidc/login'
    }
  }

  const baseClass = variant === 'ghost'
    ? `rounded-md px-4 py-2 text-sm ${className}`
    : `rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 ${className}`

  return (
    <button
      onClick={handleClick}
      className={baseClass}
    >
      {children || 'Sign Up'}
    </button>
  )
}
