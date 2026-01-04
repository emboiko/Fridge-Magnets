import { isAdmin } from "../utils.js"

export function handleAdminGetMovements(socket, context) {
  const { socketId, socketIPs, adminIPs, activeMagnetMovements, refrigerator } = context

  socket.on("adminGetMovements", () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const movements = []
    for (const [id, movement] of activeMagnetMovements.entries()) {
      const magnet = refrigerator.magnets[movement.magnetIndex]
      let magnetDisplay = null

      if (magnet) {
        if (magnet.sprite) {
          // Extract sprite name from path (e.g., "apple.png" -> "apple")
          const spriteName = magnet.sprite
            .split("/")
            .pop()
            .replace(/\.[^/.]+$/, "")
          magnetDisplay = spriteName
        } else if (magnet.letter) {
          magnetDisplay = magnet.letter
        }
      }

      movements.push({
        socketId: id,
        magnetIndex: movement.magnetIndex,
        username: movement.username,
        startTime: movement.startTime,
        // Fallback to index if no display - this should never happen.
        magnetDisplay: magnetDisplay || `#${movement.magnetIndex}`,
      })
    }

    socket.emit("adminMovementsList", { movements })
  })
}
