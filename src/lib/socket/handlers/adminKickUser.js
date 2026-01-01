import { adminKickUserSchema } from "../../validation/socketSchemas.js"
import { KickLog } from "../../db/KickLog.js"
import { isAdmin } from "../utils.js"

/**
 * Handles admin kick user request
 */
export function handleAdminKickUser(socket, io, context) {
  const { socketId, socketIPs, adminIPs, kickedSockets, kickedIPs, socketUsernames } = context

  socket.on("adminKickUser", async (data) => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const validationResult = adminKickUserSchema.safeParse(data)
    if (!validationResult.success) {
      socket.emit("error", { message: "Invalid request format" })
      return
    }

    const { socketId: targetSocketId, timeoutSeconds, message } = validationResult.data
    const targetSocket = io.sockets.sockets.get(targetSocketId)
    const targetIP = socketIPs.get(targetSocketId)

    if (!targetSocket) {
      socket.emit("error", { message: "User not found" })
      return
    }

    const kickUntil = Date.now() + timeoutSeconds * 1000
    const kickUntilDate = new Date(kickUntil)
    const targetUsername = socketUsernames.get(targetSocketId) || null
    const adminIP = socketIPs.get(socketId) || null

    // Add to kicked sockets and IPs (message can be null/undefined if not provided)
    kickedSockets.set(targetSocketId, { kickUntil, message: message || null })
    if (targetIP) {
      kickedIPs.set(targetIP, { kickUntil, message: message || null })
    }

    // Save kick log to database
    try {
      await KickLog.create({
        ipAddress: targetIP || null,
        socketId: targetSocketId,
        username: targetUsername,
        kickedAt: new Date(),
        kickUntil: kickUntilDate,
        timeoutSeconds: timeoutSeconds,
        message: message || null,
        kickedBy: adminIP || socketId,
      })
    } catch (error) {
      console.error("Error saving kick log:", error)
    }

    // Disconnect the user with kicked error code
    targetSocket.emit("error", {
      message: message || null,
      code: "KICKED",
      kickUntil: kickUntil,
    })
    targetSocket.disconnect(true)

    socket.emit("adminActionResult", { success: true, message: "User kicked successfully" })
    console.info(
      `Admin ${socketId} kicked user ${targetSocketId} (${targetIP}) for ${timeoutSeconds} seconds`
    )
  })
}
