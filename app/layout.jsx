import Script from "next/script"
import { Lalezar, Luckiest_Guy, Raleway } from "next/font/google"
import "./styles/globals.css"
import "./styles/canvas.css"
import "./styles/header.css"
import "./styles/screens.css"
import "./styles/modal.css"
import "./styles/chat.css"
import "./styles/admin.css"
import "./styles/contact.css"
import "./styles/about.css"
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
  openGraph: {
    title: "💩🧲.ws",
    description:
      "Anonymous multiplayer refrigerator magnets 🧲 Drag, arrange, and interact with magnets in real-time on a shared canvas",
    url: "https://fridgemagnets.fun",
    siteName: "Fridge Magnets",
    images: [
      {
        url: "https://fridgemagnets.fun/img/utility/og_preview.png",
        width: 1200,
        height: 630,
        alt: "Fridge Magnets - Anonymous multiplayer refrigerator magnets",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fridge Magnets",
    description:
      "Anonymous multiplayer refrigerator magnets 🧲 Drag, arrange, and interact with magnets in real-time on a shared canvas",
    images: ["https://fridgemagnets.fun/img/utility/og_preview.png"],
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
    /* 
    Preventing FOUC (Flash of Unstyled Content) from UI mode updating on page load:
    Blocking script sets dark-mode class immediately (no flash)
    Content is hidden until React hydrates
    React initializes the store and adds hydrated class
    Content appears with the correct mode already applied
    No hydration warning because we've suppressed it for this intentional case
    */
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('fridge-magnets-dark-mode');
                  var isDarkMode;
                  
                  if (stored !== null) {
                    isDarkMode = stored === 'true';
                  } else {
                    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  }
                  
                  if (isDarkMode) {
                    document.documentElement.classList.add('dark-mode');
                  } else {
                    document.documentElement.classList.remove('dark-mode');
                  }
                } catch (e) {
                  // Fallback to dark mode if anything fails
                  document.documentElement.classList.add('dark-mode');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${lalezar.variable} ${luckiestGuy.variable} ${raleway.variable}`}>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
        <DarkModeInitializer />
        {children}
      </body>
    </html>
  )
}
