"use client"

import { useState, useEffect, useRef } from "react"
import { useSocket } from "@/src/hooks/useSocket"
import { useAdminStore } from "@/src/stores/adminStore"
import Modal from "./Modal"

export default function AdminAuthModal() {
  const setAdminAuthenticated = useAdminStore((state) => state.setAdminAuthenticated)
  const isAdminAuthModalOpen = useAdminStore((state) => state.isAdminAuthModalOpen)
  const closeAdminAuthModal = useAdminStore((state) => state.closeAdminAuthModal)
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const socket = useSocket()
  const passwordInputRef = useRef(null)

  useEffect(() => {
    if (isAdminAuthModalOpen && !isOpen) {
      setIsOpen(true)
      setError("")
      setPassword("")
    } else if (!isAdminAuthModalOpen && isOpen) {
      setIsOpen(false)
    }
  }, [isAdminAuthModalOpen, isOpen])

  useEffect(() => {
    if (isOpen && passwordInputRef.current) {
      passwordInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!socket) {
      return
    }

    const handleAuthResult = (data) => {
      setIsLoading(false)
      if (data.success) {
        setIsOpen(false)
        closeAdminAuthModal()
        setPassword("")
        setError("")
        setAdminAuthenticated(true)
      } else {
        setError(data.message || "Authentication failed")
        setPassword("")
      }
    }

    socket.on("adminAuthResult", handleAuthResult)

    return () => {
      socket.off("adminAuthResult", handleAuthResult)
    }
  }, [socket, setAdminAuthenticated, closeAdminAuthModal])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!socket || !password.trim()) {
      return
    }

    setIsLoading(true)
    setError("")
    socket.emit("adminAuth", { password: password.trim() })
  }

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false)
      closeAdminAuthModal()
      setPassword("")
      setError("")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Admin Login">
      <form onSubmit={handleSubmit}>
        <div className="admin-auth-field">
          <label htmlFor="admin-password" className="admin-auth-label">
            Password:
          </label>
          <input
            ref={passwordInputRef}
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError("")
            }}
            onKeyDown={(e) => {
              if (e.key !== "Escape") {
                e.stopPropagation()
              }
            }}
            disabled={isLoading}
            className="admin-auth-input"
            autoComplete="off"
          />
        </div>
        <div className="admin-auth-actions">
          <div
            className="admin-auth-error"
            style={{
              visibility: error ? "visible" : "hidden",
            }}
          >
            {error || "\u00A0"}
          </div>
          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="admin-auth-submit-button"
          >
            Submit
          </button>
        </div>
      </form>
    </Modal>
  )
}
