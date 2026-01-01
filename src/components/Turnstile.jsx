"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react"
import { TURNSTILE_MAX_LOAD_ATTEMPTS, TURNSTILE_CHECK_INTERVAL_MS } from "@/src/lib/constants.js"

const Turnstile = forwardRef(({ onVerify, onError, onExpire, onTimeout }, ref) => {
  const turnstileWidgetIdRef = useRef(null)
  const turnstileContainerRef = useRef(null)

  const handleVerify = useCallback(
    (token) => {
      onVerify(token)
    },
    [onVerify]
  )

  const handleError = useCallback(() => {
    onError?.()
  }, [onError])

  const handleExpire = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  const handleTimeout = useCallback(() => {
    onTimeout?.()
  }, [onTimeout])

  useEffect(() => {
    // Use test keys for local development if no keys are configured
    const siteKey =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      (process.env.NODE_ENV === "development" ? "1x00000000000000000000AA" : null)

    if (!siteKey) {
      console.warn("Turnstile site key not configured. Captcha will not work.")
      return
    }

    const loadTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current && !turnstileWidgetIdRef.current) {
        try {
          const widgetId = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            callback: handleVerify,
            "error-callback": handleError,
            "expired-callback": handleExpire,
            "timeout-callback": handleTimeout,
          })
          turnstileWidgetIdRef.current = widgetId
        } catch (err) {
          console.error("Error rendering Turnstile:", err)
          handleError()
        }
      }
    }

    if (window.turnstile) {
      loadTurnstile()
    } else {
      let attempts = 0
      const checkTurnstile = setInterval(() => {
        attempts++
        if (window.turnstile) {
          loadTurnstile()
          clearInterval(checkTurnstile)
        } else if (attempts >= TURNSTILE_MAX_LOAD_ATTEMPTS) {
          clearInterval(checkTurnstile)
          handleError()
        }
      }, TURNSTILE_CHECK_INTERVAL_MS)

      return () => clearInterval(checkTurnstile)
    }

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current)
          turnstileWidgetIdRef.current = null
        } catch (err) {
          console.error("Error removing Turnstile:", err)
        }
      }
    }
  }, [handleVerify, handleError, handleExpire, handleTimeout])

  const reset = () => {
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current)
    }
  }

  useImperativeHandle(ref, () => ({
    reset,
  }))

  return <div ref={turnstileContainerRef} className="turnstile-container" />
})

Turnstile.displayName = "Turnstile"

export default Turnstile
