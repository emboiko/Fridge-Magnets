/**
 * Handles socket disconnect events
 */
export function handleDisconnect(socket, context) {
  const {
    socketId,
    clientIp,
    activeMagnetMovements,
    socketUsernames,
    activeUsernames,
    rateLimitMap,
    chatRateLimitMap,
    socketIPs,
    kickedSockets,
    attemptedUsernames,
    activeIPs,
    io,
  } = context

  socket.on("disconnect", () => {
    // Note: We don't remove from adminIPs on disconnect - admin status persists across reconnects

    // Remove from active movements
    activeMagnetMovements.delete(socketId)

    // Remove username from active set
    const username = socketUsernames.get(socketId)
    if (username) {
      activeUsernames.delete(username.toLowerCase())
      socketUsernames.delete(socketId)
      // Broadcast leave message
      io.emit("systemMessage", {
        type: "userLeft",
        username: username,
        timestamp: Date.now(),
      })
    }

    // Clean up tracking
    rateLimitMap.delete(socketId)
    chatRateLimitMap.delete(socketId)
    const disconnectedIP = socketIPs.get(socketId)
    socketIPs.delete(socketId)
    kickedSockets.delete(socketId)
    attemptedUsernames.delete(socketId)

    // Clean up active IP tracking
    if (disconnectedIP && activeIPs) {
      // Only remove if this socket still owns the IP (in case of race conditions)
      if (activeIPs.get(disconnectedIP) === socketId) {
        activeIPs.delete(disconnectedIP)
      }
    }

    console.info(`Client disconnected: ${socketId} from ${clientIp}`)
  })
}
