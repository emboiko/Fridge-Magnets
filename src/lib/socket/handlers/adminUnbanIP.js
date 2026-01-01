import { adminUnbanIPSchema } from "../../validation/socketSchemas.js"
import { BannedIP } from "../../db/BannedIP.js"
import { isAdmin } from "../utils.js"

/**
 * Handles admin unban IP request
 */
export function handleAdminUnbanIP(socket, context) {
  const { socketId, socketIPs, adminIPs, bannedIPsSet } = context

  socket.on("adminUnbanIP", async (data) => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const validationResult = adminUnbanIPSchema.safeParse(data)
    if (!validationResult.success) {
      socket.emit("error", { message: "Invalid request format" })
      return
    }

    const { ipAddress } = validationResult.data

    try {
      await BannedIP.findOneAndDelete({ ipAddress })
      bannedIPsSet.delete(ipAddress)
      socket.emit("adminActionResult", { success: true, message: "IP unbanned successfully" })
      console.info(`Admin ${socketId} unbanned IP: ${ipAddress}`)
    } catch (error) {
      console.error("Error unbanning IP:", error)
      socket.emit("error", { message: "Failed to unban IP" })
    }
  })
}

