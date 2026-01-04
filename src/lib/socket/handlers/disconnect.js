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
    socketPings,
    io,
  } = context

  socket.on("disconnect", () => {
    activeMagnetMovements.delete(socketId)
    const username = socketUsernames.get(socketId)
    if (username) {
      activeUsernames.delete(username.toLowerCase())
      socketUsernames.delete(socketId)
      io.emit("systemMessage", {
        type: "userLeft",
        username: username,
        timestamp: Date.now(),
      })
    }

    rateLimitMap.delete(socketId)
    chatRateLimitMap.delete(socketId)
    const disconnectedIP = socketIPs.get(socketId)
    socketIPs.delete(socketId)
    kickedSockets.delete(socketId)
    attemptedUsernames.delete(socketId)
    socketPings.delete(socketId)

    if (disconnectedIP && activeIPs) {
      if (activeIPs.get(disconnectedIP) === socketId) {
        activeIPs.delete(disconnectedIP)
      }
    }

    console.info(`Client disconnected: ${socketId} from ${clientIp}`)
  })
}
