import Script from "next/script"
import { Lalezar, Luckiest_Guy, Raleway } from "next/font/google"
import "./styles/globals.css"
import "./styles/canvas.css"
import "./styles/header.css"
import "./styles/pages.css"
import "./styles/modal.css"
import "./styles/chat.css"
import "./styles/admin.css"
import "./styles/contact.css"
import "./styles/about.css"
import "./styles/turnstile.css"
import DarkModeInitializer from "@/src/components/DarkModeInitializer"

/**
 * - `next/font/google` automatically optimizes Google Fonts
 * - Fonts are self-hosted (better performance, no external requests)
 * - CSS variables are automatically generated for each font
 * - This is the recommended approach for App Router (replaces _document.js pattern)
 */

const lalezar = Lalezar({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lalezar",
  display: "swap",
})

const luckiestGuy = Luckiest_Guy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-luckiest-guy",
  display: "swap",
})

const raleway = Raleway({
  weight: "500",
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
})

export const metadata = {
  title: "Fridge Magnets",
  description: "Anonymous multiplayer refrigerator magnets",
  icons: {
    icon: "/img/header/fridge.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${lalezar.variable} ${luckiestGuy.variable} ${raleway.variable}`}>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        <DarkModeInitializer />
        {children}
      </body>
    </html>
  )
}
