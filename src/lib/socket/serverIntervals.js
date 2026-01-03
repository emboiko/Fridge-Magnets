import { magnetUpdateEventSchema } from "../validation/socketSchemas.js"
import {
  SERVER_UPDATE_INTERVAL_MS,
  SERVER_SAVE_DEBOUNCE_MS,
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
    changedMagnetIndices,
  } = context

  // Update loop - broadcast differential updates
  setInterval(() => {
    if (changedMagnetIndices.size === 0) {
      return
    }

    // Atomically capture changed indices (snapshot the set)
    const changedIndices = Array.from(changedMagnetIndices)

    // Build differential update with only changed magnets
    const changes = []
    for (const index of changedIndices) {
      if (index >= 0 && index < refrigerator.magnets.length) {
        const magnet = refrigerator.magnets[index]
        changes.push({
          index: index,
          magnet: magnet.toObject(),
        })
      }
    }

    if (changes.length === 0) {
      changedMagnetIndices.clear()
      return
    }

    // Validate and broadcast differential update
    const updateData = {
      type: "differential",
      changes: changes,
    }

    const validationResult = magnetUpdateEventSchema.safeParse(updateData)
    if (validationResult.success) {
      io.emit("update", validationResult.data)
      // Only clear tracking AFTER successful broadcast
      for (const index of changedIndices) {
        changedMagnetIndices.delete(index)
      }
    } else {
      console.error("Invalid update data structure, skipping broadcast:", validationResult.error)
      for (const index of changedIndices) {
        changedMagnetIndices.delete(index)
      }
    }
  }, SERVER_UPDATE_INTERVAL_MS)

  // Debounced save - save a few seconds after the last change
  // This prevents saves during active dragging, only saving after activity stops
  // No fallback interval - we rely solely on debounce to avoid blocking during dragging
  let saveTimeout = null

  const scheduleSave = () => {
    // Clear any pending save
    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }

    if (!magnetsChanged.value) {
      return
    }

    saveTimeout = setTimeout(async () => {
      saveTimeout = null

      // Double-check magnets still changed (may have been saved by admin reset or other operation)
      if (!magnetsChanged.value) {
        return
      }

      try {
        await refrigerator.save()
        magnetsChanged.value = false
      } catch (error) {
        console.error("Error saving to database:", error)
      }
    }, SERVER_SAVE_DEBOUNCE_MS)
  }

  // Expose scheduleSave and clearPendingSave to context
  // clearPendingSave allows admin reset to cancel pending debounced saves
  const clearPendingSave = () => {
    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  }

  // Force save immediately - bypasses debounce for graceful shutdown
  // Used when server is being terminated to ensure no data loss
  const forceSave = async () => {
    clearPendingSave()
    if (!magnetsChanged.value) {
      return
    }
    try {
      await refrigerator.save()
      magnetsChanged.value = false
    } catch (error) {
      console.error("Error force-saving to database during shutdown:", error)
      throw error
    }
  }

  context.scheduleSave = scheduleSave
  context.clearPendingSave = clearPendingSave
  context.forceSave = forceSave

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
