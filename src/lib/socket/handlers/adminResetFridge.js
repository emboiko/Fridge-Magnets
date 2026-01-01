import { magnetsArraySchema } from "../../validation/socketSchemas.js"
import { isAdmin } from "../utils.js"

/**
 * Handles admin reset fridge request
 */
export function handleAdminResetFridge(socket, io, context) {
  const { socketId, socketIPs, adminIPs, refrigerator } = context

  socket.on("adminResetFridge", async () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    try {
      await refrigerator.initializeMagnets()
      await refrigerator.save()

      const magnetsData = refrigerator.getMagnetsAsObjects()
      const validationResult = magnetsArraySchema.safeParse(magnetsData)

      if (validationResult.success) {
        io.emit("welcome", validationResult.data)
        socket.emit("adminActionResult", { success: true, message: "Fridge reset successfully" })
        console.info(`Admin ${socketId} reset the fridge`)
      } else {
        socket.emit("error", { message: "Failed to reset fridge: invalid data" })
      }
    } catch (error) {
      console.error("Error resetting fridge:", error)
      socket.emit("error", { message: "Failed to reset fridge" })
    }
  })
}

