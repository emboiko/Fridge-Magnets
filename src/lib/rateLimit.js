import { API_RATE_LIMIT_MAX_REQUESTS, API_RATE_LIMIT_WINDOW_MS } from "./constants.js"

const rateLimitMap = new Map()

function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  return "unknown"
}

function cleanupOldEntries(now) {
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}

export function checkRateLimit(request) {
  const clientIP = getClientIP(request)
  const now = Date.now()

  const entry = rateLimitMap.get(clientIP)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + API_RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime,
    })

    cleanupOldEntries(now)

    return {
      allowed: true,
      remaining: API_RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime,
    }
  }

  if (entry.count >= API_RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  entry.count++
  rateLimitMap.set(clientIP, entry)

  cleanupOldEntries(now)

  return {
    allowed: true,
    remaining: API_RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  }
}
