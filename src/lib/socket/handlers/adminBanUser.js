import { adminBanUserSchema } from "../../validation/socketSchemas.js"
import { BannedIP } from "../../db/BannedIP.js"
import { isAdmin } from "../utils.js"

/**
 * Handles admin ban user request
 */
export function handleAdminBanUser(socket, io, context) {
  const { socketId, socketIPs, adminIPs, bannedIPsSet } = context

  socket.on("adminBanUser", async (data) => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const validationResult = adminBanUserSchema.safeParse(data)
    if (!validationResult.success) {
      socket.emit("error", { message: "Invalid request format" })
      return
    }

    const { socketId: targetSocketId, reason } = validationResult.data
    const targetSocket = io.sockets.sockets.get(targetSocketId)
    const targetIP = socketIPs.get(targetSocketId)

    if (!targetSocket || !targetIP) {
      socket.emit("error", { message: "User not found" })
      return
    }

    try {
      // Add to database
      await BannedIP.findOneAndUpdate(
        { ipAddress: targetIP },
        { ipAddress: targetIP, reason: reason || null, bannedAt: new Date() },
        { upsert: true, new: true }
      )

      // Add to in-memory set
      bannedIPsSet.add(targetIP)

      // Disconnect the user with banned error code
      targetSocket.emit("error", {
        message: reason || null,
        code: "BANNED",
        reason: reason || null,
      })
      targetSocket.disconnect(true)

      socket.emit("adminActionResult", { success: true, message: "User banned successfully" })
      console.info(`Admin ${socketId} banned user ${targetSocketId} (IP: ${targetIP})`)
    } catch (error) {
      console.error("Error banning user:", error)
      socket.emit("error", { message: "Failed to ban user" })
    }
  })
}

