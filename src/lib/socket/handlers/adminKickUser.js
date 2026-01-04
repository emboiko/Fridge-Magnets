import { adminKickUserSchema } from "../../validation/socketSchemas.js"
import { KickLog } from "../../db/KickLog.js"
import { isAdmin, normalizeIP } from "../utils.js"

export function handleAdminKickUser(socket, context) {
  const { socketId, socketIPs, adminIPs, kickedSockets, kickedIPs, socketUsernames, io } = context

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
    const rawTargetIP = socketIPs.get(targetSocketId)

    if (!targetSocket) {
      socket.emit("error", { message: "User not found" })
      return
    }

    const targetIP = rawTargetIP ? normalizeIP(rawTargetIP) : null
    const kickUntil = Date.now() + timeoutSeconds * 1000
    const kickUntilDate = new Date(kickUntil)
    const targetUsername = socketUsernames.get(targetSocketId) || null
    const rawAdminIP = socketIPs.get(socketId) || null
    const adminIP = rawAdminIP ? normalizeIP(rawAdminIP) : null

    kickedSockets.set(targetSocketId, { kickUntil, message: message || null })
    if (targetIP) {
      kickedIPs.set(targetIP, { kickUntil, message: message || null })
    }

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
