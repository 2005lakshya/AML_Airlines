import { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import FloatingNavbar from "../components/floating-navbar"
import AuthModal from "../components/auth-modal"
import AuthInterceptor from "../components/auth-interceptor"
import AuthNotification from "../components/auth-notification"
import AnimatedBg from "../components/animated-bg"
import { AuthProvider } from "../contexts/auth-context"
import { Suspense } from "react"

export const metadata = {
  title: "AML Airways",
  description: "AML Airways - Your premium airline booking experience",
  generator: "AML Airways",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <Suspense fallback={null}>
            <AnimatedBg />
            <FloatingNavbar />
            <AuthModal />
            <AuthNotification />
            <AuthInterceptor />
            <main>{children}</main>
            <Analytics />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
