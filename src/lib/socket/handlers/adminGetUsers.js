import { isAdmin, normalizeIP } from "../utils.js"

export function handleAdminGetUsers(socket, context) {
  const { socketId, socketIPs, adminIPs, socketUsernames, attemptedUsernames, socketPings } =
    context

  socket.on("adminGetUsers", () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const users = []
    for (const [id, ipAddress] of socketIPs.entries()) {
      let username = socketUsernames.get(id) || null
      const attemptedUsername = attemptedUsernames.get(id)

      if (!username && attemptedUsername) {
        const attemptedLower = attemptedUsername.toLowerCase()
        let count = 0

        for (const [, otherUsername] of socketUsernames.entries()) {
          if (otherUsername && otherUsername.toLowerCase() === attemptedLower) {
            count++
          }
        }

        for (const [otherAttemptedId, otherAttempted] of attemptedUsernames.entries()) {
          if (
            otherAttemptedId !== id &&
            otherAttempted &&
            otherAttempted.toLowerCase() === attemptedLower &&
            !socketUsernames.has(otherAttemptedId) &&
            otherAttemptedId < id
          ) {
            count++
          }
        }

        username = `${attemptedUsername} ${count + 1}`
      }

      const ping = socketPings.get(id) || null

      users.push({
        socketId: id,
        username: username,
        attemptedUsername: attemptedUsername || null,
        ipAddress: ipAddress ? normalizeIP(ipAddress) : "unknown",
        ping: ping,
      })
    }

    socket.emit("adminUsersList", { users, totalCount: users.length, currentSocketId: socketId })
  })
}
