import { BannedIP } from "../db/BannedIP.js"
import { normalizeIP } from "./utils.js"

/**
 * Validates a new socket connection
 * @param {Object} socket - The socket instance
 * @param {string} socketId - The socket ID
 * @param {Object} context - Shared state context
 * @returns {Promise<{valid: boolean, clientIp: string, error?: Object}>}
 */
export async function validateConnection(socket, socketId, context) {
  const { bannedIPsSet, kickedIPs, activeIPs, io } = context

  // In development, allow test IP override from handshake auth
  let clientIp = socket.handshake.address
  if (process.env.NODE_ENV !== "production" && socket.handshake.auth?.testIP) {
    clientIp = socket.handshake.auth.testIP
    console.info(
      `[DEV] Using test IP ${clientIp} for socket ${socketId} (real IP: ${socket.handshake.address})`
    )
  } else {
    // Extract real client IP from headers (important for Heroku/proxies)
    // X-Forwarded-For contains the original client IP when behind a proxy
    const xForwardedFor = socket.handshake.headers["x-forwarded-for"]
    if (xForwardedFor) {
      const forwardedIps = xForwardedFor.split(",").map((ip) => ip.trim())
      if (forwardedIps.length > 0) {
        clientIp = forwardedIps[0]
      }
    } else {
      // Fallback to X-Real-IP if X-Forwarded-For is not present
      const xRealIP = socket.handshake.headers["x-real-ip"]
      if (xRealIP) {
        clientIp = xRealIP.trim()
      }
    }
  }

  clientIp = normalizeIP(clientIp)

  // Check if IP is banned
  if (bannedIPsSet.has(clientIp)) {
    console.warn(`Rejected connection from banned IP: ${clientIp}`)
    try {
      const bannedIP = await BannedIP.findOne({
        $or: [{ ipAddress: clientIp }, { ipAddress: `::ffff:${clientIp}` }],
      })
      socket.emit("error", {
        message: bannedIP?.reason || null,
        code: "BANNED",
        reason: bannedIP?.reason || null,
      })
    } catch (error) {
      console.error("Error fetching ban reason:", error)
      socket.emit("error", {
        message: null,
        code: "BANNED",
      })
    }
    socket.disconnect(true)
    return { valid: false, clientIp }
  }

  // Check if IP was kicked and still within timeout
  const kickedIP = kickedIPs.get(clientIp)
  if (kickedIP && Date.now() < kickedIP.kickUntil) {
    socket.emit("error", {
      message: kickedIP.message || null,
      code: "KICKED",
    })
    socket.disconnect(true)
    return { valid: false, clientIp }
  }

  // Check if IP already has an active connection
  const existingSocketId = activeIPs.get(clientIp)
  if (existingSocketId) {
    const existingSocket = io.sockets.sockets.get(existingSocketId)
    if (existingSocket && existingSocket.connected) {
      console.warn(
        `Rejected duplicate connection from IP: ${clientIp} (existing: ${existingSocketId})`
      )
      socket.emit("error", {
        message: "already_connected",
        code: "ALREADY_CONNECTED",
      })
      socket.disconnect(true)
      return { valid: false, clientIp }
    } else {
      // Clean up stale entry
      activeIPs.delete(clientIp)
    }
  }

  return { valid: true, clientIp }
}
