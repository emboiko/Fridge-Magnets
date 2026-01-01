"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUIStore } from "@/src/stores/uiStore"
import { useAdminStore } from "@/src/stores/adminStore"
import Modal from "./Modal"
import AboutModal from "./modals/AboutModal"
import ContactModal from "./modals/ContactModal"

export default function Header() {
  const isHeaderVisible = useUIStore((state) => state.isHeaderVisible)
  const isAdminAuthenticated = useAdminStore((state) => state.isAdminAuthenticated)
  const toggleAdminPanel = useAdminStore((state) => state.toggleAdminPanel)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const toggleChat = useUIStore((state) => state.toggleChat)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  if (!isHeaderVisible) {
    return null
  }

  const titleContent = (
    <h1 id="main-title">
      Frid<span className="portal-blue">g</span>e Ma<span className="portal-orange">g</span>
      nets
    </h1>
  )

  return (
    <>
      <div id="header">
        <Image id="cone" src="/img/header/cone.png" alt="cone" width={60} height={60} priority />
        <p id="beta">Beta</p>
        <div id="main-title-box">
          {isHomePage ? (
            titleContent
          ) : (
            <Link href="/" className="header-title-link">
              {titleContent}
            </Link>
          )}
          <div className="links">
            <button className="portal-blue header-link-button" onClick={() => setIsAboutOpen(true)}>
              About
            </button>
            <button className="header-link-button" onClick={toggleChat}>
              Chat
            </button>
            <button
              className="portal-orange header-link-button"
              onClick={() => setIsContactOpen(true)}
            >
              Contact
            </button>
            {isAdminAuthenticated && (
              <button className="header-link-button admin-link-button" onClick={toggleAdminPanel}>
                Admin
              </button>
            )}
          </div>
        </div>
        <Image
          id="fridge-icon"
          src="/img/header/fridge.png"
          alt="fridge"
          width={60}
          height={60}
          priority
          onClick={toggleDarkMode}
        />
      </div>

      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)}>
        <AboutModal
          onOpenContact={() => {
            setIsAboutOpen(false)
            setIsContactOpen(true)
          }}
        />
      </Modal>

      <Modal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)}>
        <ContactModal onSuccess={() => {}} />
      </Modal>
    </>
  )
}
