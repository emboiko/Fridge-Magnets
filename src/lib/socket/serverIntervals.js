import { magnetsArraySchema } from "../validation/socketSchemas.js"
import {
  SERVER_UPDATE_INTERVAL_MS,
  SERVER_SAVE_INTERVAL_MS,
  SERVER_CLEANUP_INTERVAL_MS,
  SERVER_ADMIN_MOVEMENT_BROADCAST_INTERVAL_MS,
  SERVER_MOVEMENT_STALE_TIMEOUT_MS,
} from "../constants.js"

/**
 * Sets up all server interval loops
 */
export function setupServerIntervals(io, context) {
  const {
    refrigerator,
    kickedSockets,
    kickedIPs,
    activeMagnetMovements,
    adminIPs,
    socketIPs,
    magnetsChanged,
  } = context

  // Track last broadcast hash for validation optimization
  let lastBroadcastMagnetsHash = null

  // Update loop using setTimeout recursion to reduce drift
  // This pattern compensates for event loop blocking by calculating the next
  // execution time based on when it SHOULD run, not when it actually runs
  let nextBroadcastTime = Date.now() + SERVER_UPDATE_INTERVAL_MS

  const scheduleBroadcast = () => {
    const now = Date.now()
    // Calculate delay based on when we SHOULD run next, not when we're running now
    const delay = Math.max(0, nextBroadcastTime - now)
    nextBroadcastTime += SERVER_UPDATE_INTERVAL_MS

    setTimeout(() => {
      // Check if magnets changed before doing any expensive operations
      const magnetsDidChange = magnetsChanged.value

      if (!magnetsDidChange && lastBroadcastMagnetsHash !== null) {
        // Nothing changed - skip entire broadcast (no need to serialize/send 1409 magnets to 25 clients)
        // This saves significant CPU and network bandwidth
        scheduleBroadcast()
        return
      }

      // Magnets changed or first broadcast - need to get data and broadcast
      const magnetsData = refrigerator.getMagnetsAsObjects()

      // Calculate hash once (used for tracking changes)
      const hash = magnetsData.map((m) => `${m.x.toFixed(1)},${m.y.toFixed(1)}`).join("|")
      lastBroadcastMagnetsHash = hash

      if (magnetsDidChange) {
        magnetsChanged.value = false // Reset flag after processing
      }

      // Validate and broadcast
      const validationResult = magnetsArraySchema.safeParse(magnetsData)
      if (validationResult.success) {
        io.emit("update", validationResult.data)
      } else {
        console.error("Invalid magnet data structure, skipping broadcast:", validationResult.error)
      }

      // Schedule next broadcast
      scheduleBroadcast()
    }, delay)
  }

  // Start the broadcast loop
  scheduleBroadcast()

  // Save loop
  setInterval(async () => {
    try {
      await refrigerator.save()
    } catch (error) {
      console.error("Error saving to database:", error)
    }
  }, SERVER_SAVE_INTERVAL_MS)

  // Cleanup expired kicks and stale movements
  setInterval(() => {
    const now = Date.now()
    for (const [socketId, kick] of kickedSockets.entries()) {
      if (now >= kick.kickUntil) {
        kickedSockets.delete(socketId)
      }
    }
    for (const [ipAddress, kick] of kickedIPs.entries()) {
      if (now >= kick.kickUntil) {
        kickedIPs.delete(ipAddress)
      }
    }
    // Clean up movements that haven't been updated in the timeout period
    for (const [socketId, movement] of activeMagnetMovements.entries()) {
      if (now - movement.lastUpdate > SERVER_MOVEMENT_STALE_TIMEOUT_MS) {
        activeMagnetMovements.delete(socketId)
      }
    }
  }, SERVER_CLEANUP_INTERVAL_MS)

  // Broadcast magnet movement updates to admin clients only
  setInterval(() => {
    if (adminIPs.size === 0) {
      return
    }

    // Build movements array (can be empty if no active movements)
    const movements = []
    for (const [socketId, movement] of activeMagnetMovements.entries()) {
      movements.push({
        socketId: socketId,
        magnetIndex: movement.magnetIndex,
        username: movement.username,
      })
    }

    // Build list of admin sockets once per interval
    const adminSocketsToNotify = []
    for (const [socketId, ipAddress] of socketIPs.entries()) {
      if (adminIPs.has(ipAddress)) {
        const adminSocket = io.sockets.sockets.get(socketId)
        if (adminSocket) {
          adminSocketsToNotify.push(adminSocket)
        }
      }
    }

    // Send to all admin sockets at once (even if movements array is empty)
    // This ensures admins receive updates to clear stale movement labels
    if (adminSocketsToNotify.length > 0) {
      const updateData = { movements }
      for (const adminSocket of adminSocketsToNotify) {
        adminSocket.emit("magnetMovementUpdate", updateData)
      }
    }
  }, SERVER_ADMIN_MOVEMENT_BROADCAST_INTERVAL_MS)
}
