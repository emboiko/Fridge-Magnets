"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Turnstile from "@/src/components/Turnstile"
import {
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
} from "@/src/lib/constants.js"

export default function ContactModal({ onSuccess }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [turnstileReady, setTurnstileReady] = useState(false)
  const turnstileRef = useRef(null)
  const [isResizingHeight, setIsResizingHeight] = useState(false)
  const textareaRef = useRef(null)
  const currentHeightRef = useRef(null)

  const handleVerify = useCallback((token) => {
    setTurnstileToken(token)
    setTurnstileReady(true)
  }, [])

  const handleError = useCallback(() => {
    setTurnstileToken(null)
    setTurnstileReady(false)
    setError("Captcha verification failed. Please try again.")
  }, [])

  const handleExpire = useCallback(() => {
    setTurnstileToken(null)
    setTurnstileReady(false)
  }, [])

  const handleTimeout = useCallback(() => {
    setTurnstileToken(null)
    setTurnstileReady(false)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!textareaRef.current || !isResizingHeight) {
        return
      }

      const textareaRect = textareaRef.current.getBoundingClientRect()
      const newHeight = e.clientY - textareaRect.top
      const minHeight = 120
      const maxHeight = 800
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
      currentHeightRef.current = clampedHeight
      textareaRef.current.style.height = `${clampedHeight}px`
    }

    const handleMouseUp = () => {
      setIsResizingHeight(false)
    }

    if (isResizingHeight) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizingHeight])

  const handleResizeHeightStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingHeight(true)
    if (textareaRef.current) {
      currentHeightRef.current = textareaRef.current.offsetHeight
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (name.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or less.`)
      return
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      setError(`Email must be ${MAX_EMAIL_LENGTH} characters or less.`)
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!contactMessage.trim()) {
      setError("Message field must not be empty.")
      return
    }

    if (contactMessage.length > MAX_CONTACT_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_CONTACT_MESSAGE_LENGTH} characters or less.`)
      return
    }

    if (!turnstileToken) {
      setError("Please complete the verification.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message: contactMessage,
          turnstileToken,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setName("")
        setEmail("")
        setContactMessage("")
        setTurnstileToken(null)
        setTurnstileReady(false)
        turnstileRef.current?.reset()
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || "Something went wrong. Please try again.")
        setTurnstileToken(null)
        setTurnstileReady(false)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setTurnstileToken(null)
      setTurnstileReady(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isButtonDisabled = isSubmitting || isSubmitted || !turnstileToken || !turnstileReady

  return (
    <div>
      <h3 className="contact-title">Tell us how to improve.</h3>
      <p className="contact-description">
        Are we missing your favorite magnet? Send us a message, and we&apos;ll add it to the fridge!
        Perhaps you&apos;ve encountered some unexpected behavior or a bug. Feel free to leave a
        message anonymously, or include your email if you&apos;d like a reply.
      </p>
      <form onSubmit={handleSubmit} className="contact-form">
        <input
          type="text"
          name="name"
          placeholder="Anonymous"
          value={name}
          onChange={(e) => {
            if (e.target.value.length <= MAX_NAME_LENGTH) {
              setName(e.target.value)
            }
          }}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          disabled={isSubmitted}
          className="contact-input"
          maxLength={MAX_NAME_LENGTH}
        />
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => {
            if (e.target.value.length <= MAX_EMAIL_LENGTH) {
              setEmail(e.target.value)
            }
          }}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          disabled={isSubmitted}
          className="contact-input"
          maxLength={MAX_EMAIL_LENGTH}
        />
        <div className="contact-textarea-wrapper">
          <textarea
            ref={textareaRef}
            name="message"
            required
            value={contactMessage}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CONTACT_MESSAGE_LENGTH) {
                setContactMessage(e.target.value)
              }
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            placeholder="Your message..."
            rows={6}
            maxLength={MAX_CONTACT_MESSAGE_LENGTH}
            disabled={isSubmitted}
            className="contact-textarea"
          />
          <div
            className="contact-resize-handle-height"
            onMouseDown={handleResizeHeightStart}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="contact-message-info">
          <p className={`contact-char-count ${contactMessage.length > 0 ? "visible" : ""}`}>
            {contactMessage.length} / {MAX_CONTACT_MESSAGE_LENGTH}
          </p>
          {error && <p className="contact-error">{error}</p>}
        </div>
        {!isSubmitted && (
          <Turnstile
            ref={turnstileRef}
            onVerify={handleVerify}
            onError={handleError}
            onExpire={handleExpire}
            onTimeout={handleTimeout}
          />
        )}
        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`contact-submit-button ${isSubmitted ? "submitted" : ""}`}
        >
          {isSubmitted
            ? "Submitted"
            : isSubmitting
              ? "Submitting..."
              : !turnstileToken || !turnstileReady
                ? "Please complete verification"
                : "Submit"}
        </button>
      </form>
    </div>
  )
}
