import { BannedIP } from "../../db/BannedIP.js"
import { isAdmin, normalizeIP } from "../utils.js"

/**
 * Handles admin get banned IPs request
 */
export function handleAdminGetBannedIPs(socket, context) {
  const { socketId, socketIPs, adminIPs } = context

  socket.on("adminGetBannedIPs", async () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    try {
      const bannedIPs = await BannedIP.find({}).sort({ bannedAt: -1 })
      socket.emit("adminBannedIPsList", {
        bannedIPs: bannedIPs.map((doc) => ({
          ipAddress: normalizeIP(doc.ipAddress),
          bannedAt: doc.bannedAt,
          reason: doc.reason || null,
        })),
      })
    } catch (error) {
      console.error("Error fetching banned IPs:", error)
      socket.emit("error", { message: "Failed to fetch banned IPs" })
    }
  })
}

