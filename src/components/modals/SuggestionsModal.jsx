"use client"

import { useState, useRef, useCallback } from "react"
import Turnstile from "@/src/components/Turnstile"
import { MAX_SUGGESTION_LENGTH, MAX_NAME_LENGTH, MAX_EMAIL_LENGTH } from "@/src/lib/constants.js"

export default function SuggestionsModal({ onSuccess }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [suggestion, setSuggestion] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [turnstileReady, setTurnstileReady] = useState(false)
  const turnstileRef = useRef(null)

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

    if (!suggestion.trim()) {
      setError("Message field must not be empty.")
      return
    }

    if (suggestion.length > MAX_SUGGESTION_LENGTH) {
      setError(`Suggestion must be ${MAX_SUGGESTION_LENGTH} characters or less.`)
      return
    }

    if (!turnstileToken) {
      setError("Please complete the verification.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          suggestion,
          turnstileToken,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setName("")
        setEmail("")
        setSuggestion("")
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
      <h3 className="suggestions-title">Tell us how to improve.</h3>
      <p className="suggestions-description">
        Are we missing your favorite magnet? Send us a message, and we&apos;ll add it to the fridge!
        Perhaps you&apos;ve encountered some unexpected behavior or a bug. Feel free to leave a
        message anonymously, or include your email if you&apos;d like a reply.
      </p>
      <form onSubmit={handleSubmit} className="suggestions-form">
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
          className="suggestions-input"
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
          className="suggestions-input"
          maxLength={MAX_EMAIL_LENGTH}
        />
        <textarea
          name="suggestion"
          required
          value={suggestion}
          onChange={(e) => {
            if (e.target.value.length <= MAX_SUGGESTION_LENGTH) {
              setSuggestion(e.target.value)
            }
          }}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          placeholder="Your suggestion..."
          rows={6}
          maxLength={MAX_SUGGESTION_LENGTH}
          disabled={isSubmitted}
          className="suggestions-textarea"
        />
        <p className={`suggestions-char-count ${suggestion.length > 0 ? "visible" : ""}`}>
          {suggestion.length} / {MAX_SUGGESTION_LENGTH}
        </p>
        {error && <p className="suggestions-error">{error}</p>}
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
          className={`suggestions-submit-button ${isSubmitted ? "submitted" : ""}`}
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
