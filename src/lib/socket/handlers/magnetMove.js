import { magnetMoveSchema } from "../../validation/socketSchemas.js"
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_MOVES } from "../../constants.js"

/**
 * Handles magnet movement events
 */
export function handleMagnetMove(socket, context) {
  const {
    socketId,
    clientIp,
    rateLimitMap,
    refrigerator,
    activeMagnetMovements,
    socketUsernames,
    scheduleSave,
  } = context

  socket.on("magnetMove", (data) => {
    const rateLimit = rateLimitMap.get(socketId)
    const now = Date.now()
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0
      rateLimit.resetTime = now + RATE_LIMIT_WINDOW_MS
    }

    if (rateLimit.count >= RATE_LIMIT_MAX_MOVES) {
      if (rateLimit.count === RATE_LIMIT_MAX_MOVES) {
        console.warn(
          `Rate limit exceeded for socket ${socketId} from ${clientIp} (${RATE_LIMIT_MAX_MOVES} moves/sec limit)`
        )
      }
      socket.emit("error", { message: "Rate limit exceeded. Please slow down." })
      return
    }

    rateLimit.count++

    const validationResult = magnetMoveSchema.safeParse(data)
    if (!validationResult.success) {
      console.error(`Invalid magnetMove data from ${clientIp}:`, validationResult.error)
      socket.emit("error", { message: "Invalid data format" })
      return
    }

    const { x, y, magnetIndex } = validationResult.data

    if (magnetIndex < 0 || magnetIndex >= refrigerator.magnets.length) {
      console.warn(
        `Invalid magnet index ${magnetIndex} from ${clientIp} (max: ${refrigerator.magnets.length - 1})`
      )
      socket.emit("error", { message: "Invalid magnet index" })
      return
    }

    // Update magnet position in memory
    // Note: We don't broadcast here - the update loop handles it
    refrigerator.magnets[magnetIndex].x = x
    refrigerator.magnets[magnetIndex].y = y

    // Mark that magnets have changed (for validation optimization)
    context.magnetsChanged.value = true
    // Track which magnet changed (for differential updates)
    context.changedMagnetIndices.add(magnetIndex)

    // Schedule debounced save - will save 3 seconds after last change
    scheduleSave()

    // Track magnet movement for admin panel
    const username = socketUsernames.get(socketId) || null
    if (!activeMagnetMovements.has(socketId)) {
      activeMagnetMovements.set(socketId, {
        magnetIndex: magnetIndex,
        username: username,
        startTime: Date.now(),
        lastUpdate: Date.now(),
      })
    } else {
      const movement = activeMagnetMovements.get(socketId)
      movement.magnetIndex = magnetIndex
      movement.username = username
      movement.lastUpdate = Date.now()
    }
  })
}
