import { magnetsArraySchema } from "../../validation/socketSchemas.js"
import { isAdmin } from "../utils.js"
import { RESET_ANIMATION_WINDOW_MS } from "../../constants.js"

export function handleAdminResetFridge(socket, context) {
  const {
    socketId,
    socketIPs,
    adminIPs,
    refrigerator,
    io,
    clearPendingSave,
    resetTimeoutId,
    isResetting,
  } = context

  socket.on("adminResetFridge", async () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    try {
      await refrigerator.initializeMagnets()
      // Save immediately for safety - admin reset is a critical operation that completely
      // replaces all magnets. The interval save is fine for incremental changes, but we
      // want to ensure this major state change is persisted right away.
      await refrigerator.save()
      // Clear the changed flag since we just saved - prevents debounced save from running
      context.magnetsChanged.value = false
      // Clear any pending debounced save
      clearPendingSave()

      const magnetsData = refrigerator.getMagnetsAsObjects()
      const validationResult = magnetsArraySchema.safeParse(magnetsData)

      if (validationResult.success) {
        if (resetTimeoutId.current) {
          clearTimeout(resetTimeoutId.current)
        }
        isResetting.current = true
        io.emit("fridgeReset")
        io.emit("welcome", validationResult.data)
        resetTimeoutId.current = setTimeout(() => {
          resetTimeoutId.current = null
          isResetting.current = false
        }, RESET_ANIMATION_WINDOW_MS)
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
