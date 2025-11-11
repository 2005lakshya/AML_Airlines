"use client"

export default function SignInButton({ className = "" }) {
  const onClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/oidc/login'
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors px-4 py-2.5 font-medium ${className}`}
    >
      Continue with AWS Cognito
    </button>
  )
}