import { adminAuthSchema } from "../../validation/socketSchemas.js"
import bcrypt from "bcrypt"
import { normalizeIP } from "../utils.js"

/**
 * Handles admin authentication
 */
export function handleAdminAuth(socket, context) {
  const { socketId, clientIp, adminIPs, adminPasswordHash } = context

  socket.on("adminAuth", async (data) => {
    if (!adminPasswordHash) {
      socket.emit("adminAuthResult", { success: false, message: "Admin features are disabled" })
      return
    }

    const validationResult = adminAuthSchema.safeParse(data)
    if (!validationResult.success) {
      socket.emit("adminAuthResult", { success: false, message: "Invalid request format" })
      return
    }

    try {
      const passwordToCheck = validationResult.data.password.trim()
      const hashToCheck = adminPasswordHash.trim()
      const isMatch = await bcrypt.compare(passwordToCheck, hashToCheck)
      if (isMatch) {
        const normalizedIP = normalizeIP(clientIp)
        adminIPs.add(normalizedIP)
        socket.emit("adminAuthResult", { success: true })
        console.info(`Admin authenticated: ${socketId} from ${clientIp}`)
      } else {
        console.warn(`Admin auth failed for ${socketId}: password mismatch`)
        socket.emit("adminAuthResult", { success: false, message: "Invalid password" })
      }
    } catch (error) {
      console.error("Error during admin authentication:", error)
      socket.emit("adminAuthResult", { success: false, message: "Authentication error" })
    }
  })
}
