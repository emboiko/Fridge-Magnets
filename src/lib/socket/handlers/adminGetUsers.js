import { isAdmin, normalizeIP } from "../utils.js"

/**
 * Handles admin get users request
 */
export function handleAdminGetUsers(socket, context) {
  const { socketId, socketIPs, adminIPs, socketUsernames, attemptedUsernames } = context

  socket.on("adminGetUsers", () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const users = []
    // Iterate through ALL connected sockets, not just those with usernames
    for (const [id, ipAddress] of socketIPs.entries()) {
      let username = socketUsernames.get(id) || null
      const attemptedUsername = attemptedUsernames.get(id)

      // If no username but there's an attempted username, calculate display name with number
      if (!username && attemptedUsername) {
        // Count how many users have this username (case-insensitive)
        const attemptedLower = attemptedUsername.toLowerCase()
        let count = 0

        // Count successful usernames
        for (const [, otherUsername] of socketUsernames.entries()) {
          if (otherUsername && otherUsername.toLowerCase() === attemptedLower) {
            count++
          }
        }

        // Count other attempted usernames that come before this one (by socket ID order)
        // This ensures consistent numbering
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

        // The number should be count + 1 (since this user would be the next one)
        username = `${attemptedUsername} ${count + 1}`
      }

      users.push({
        socketId: id,
        username: username,
        attemptedUsername: attemptedUsername || null,
        ipAddress: ipAddress ? normalizeIP(ipAddress) : "unknown",
      })
    }

    socket.emit("adminUsersList", { users, totalCount: users.length, currentSocketId: socketId })
  })
}
