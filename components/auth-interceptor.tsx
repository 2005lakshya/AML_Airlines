"use client"

import React from "react"

const AuthInterceptor: React.FC = () => {
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const link = target?.closest("a") as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute("href") || ""
      const isAuth = href === "/auth" || href === "#auth" || link.dataset.authTrigger === "true"

      if (isAuth) {
        e.preventDefault()
        const mode = (link.dataset.authMode as "login" | "signup" | undefined) || undefined
        ;(window as any).__openAuthModal?.(mode)
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => document.removeEventListener("click", handleClick, { capture: true } as any)
  }, [])

  return null
}

export default AuthInterceptor
