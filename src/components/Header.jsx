"use client"

import { useState, useRef, useEffect } from "react"
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
  const isChatOpen = useUIStore((state) => state.isChatOpen)
  const isAdminPanelOpen = useAdminStore((state) => state.isAdminPanelOpen)
  const isMobile = useUIStore((state) => state.isMobile)
  const openAdminAuthModal = useAdminStore((state) => state.openAdminAuthModal)
  const isAdminAuthModalOpen = useAdminStore((state) => state.isAdminAuthModalOpen)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const pathname = usePathname()
  const titleRef = useRef(null)
  const longPressTimeoutRef = useRef(null)
  const touchStartPositionRef = useRef(null)

  useEffect(() => {
    if (!isMobile || !titleRef.current || isAdminAuthenticated || isAdminAuthModalOpen) {
      return
    }

    const titleElement = titleRef.current
    const LONG_PRESS_DURATION = 5000
    const MAX_MOVE_DISTANCE = 10

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      touchStartPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }

      longPressTimeoutRef.current = setTimeout(() => {
        openAdminAuthModal()
        longPressTimeoutRef.current = null
      }, LONG_PRESS_DURATION)
    }

    const handleTouchMove = (e) => {
      if (!touchStartPositionRef.current || !longPressTimeoutRef.current) {
        return
      }

      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPositionRef.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartPositionRef.current.y)

      if (deltaX > MAX_MOVE_DISTANCE || deltaY > MAX_MOVE_DISTANCE) {
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current)
          longPressTimeoutRef.current = null
        }
      }
    }

    const handleTouchEnd = () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = null
      }
      touchStartPositionRef.current = null
    }

    const handleTouchCancel = () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = null
      }
      touchStartPositionRef.current = null
    }

    titleElement.addEventListener("touchstart", handleTouchStart, { passive: true })
    titleElement.addEventListener("touchmove", handleTouchMove, { passive: true })
    titleElement.addEventListener("touchend", handleTouchEnd, { passive: true })
    titleElement.addEventListener("touchcancel", handleTouchCancel, { passive: true })

    return () => {
      titleElement.removeEventListener("touchstart", handleTouchStart)
      titleElement.removeEventListener("touchmove", handleTouchMove)
      titleElement.removeEventListener("touchend", handleTouchEnd)
      titleElement.removeEventListener("touchcancel", handleTouchCancel)
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }, [isMobile, isAdminAuthenticated, isAdminAuthModalOpen, openAdminAuthModal])

  if (!isHeaderVisible) {
    return null
  }

  if (isMobile && (isChatOpen || isAdminPanelOpen)) {
    return null
  }

  const titleContent = (
    <h1 id="main-title">
      Frid<span className="portal-blue">g</span>e Ma<span className="portal-orange">g</span>
      nets
    </h1>
  )

  const isHomePage = pathname === "/"

  return (
    <>
      <div id="header">
        <div id="cone-container">
          <Image
            id="cone"
            src="/img/header/cone.png"
            alt="cone"
            width={60}
            height={60}
            priority
            unoptimized
          />
        </div>
        <div id="main-title-box">
          {isHomePage ? (
            <div ref={titleRef} className="header-title-touchable">
              {titleContent}
            </div>
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
          unoptimized
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
