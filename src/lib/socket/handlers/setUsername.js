import { MAX_USERNAME_LENGTH } from "../../constants.js"

/**
 * Handles username setting
 */
export function handleSetUsername(socket, io, context) {
  const { socketId, socketUsernames, activeUsernames, attemptedUsernames } = context

  socket.on("setUsername", (data) => {
    const trimmedUsername = data.username?.trim()
    const currentUsername = socketUsernames.get(socketId)

    // Handle clearing username (empty string)
    if (!trimmedUsername || trimmedUsername.length === 0) {
      if (currentUsername) {
        // User is leaving - broadcast leave message
        activeUsernames.delete(currentUsername.toLowerCase())
        socketUsernames.delete(socketId)
        io.emit("systemMessage", {
          type: "userLeft",
          username: currentUsername,
          timestamp: Date.now(),
        })
      }
      socket.emit("usernameSet", { username: "" })
      return
    }

    // Validate username length
    if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
      socket.emit("usernameError", {
        message: `Username must be between 1 and ${MAX_USERNAME_LENGTH} characters`,
      })
      return
    }

    const usernameLower = trimmedUsername.toLowerCase()

    // If user already has this username, allow it (no change needed)
    if (currentUsername && currentUsername.toLowerCase() === usernameLower) {
      socket.emit("usernameSet", { username: trimmedUsername })
      return
    }

    // Check if username is already taken
    if (activeUsernames.has(usernameLower)) {
      // Track the attempted username for admin panel display
      attemptedUsernames.set(socketId, trimmedUsername)
      socket.emit("usernameError", { message: "Username is already taken" })
      return
    }

    // Remove old username from active set if exists and broadcast leave
    if (currentUsername) {
      activeUsernames.delete(currentUsername.toLowerCase())
      io.emit("systemMessage", {
        type: "userLeft",
        username: currentUsername,
        timestamp: Date.now(),
      })
    }

    // Set new username and broadcast join
    socketUsernames.set(socketId, trimmedUsername)
    activeUsernames.add(usernameLower)
    // Clear attempted username since it was successful
    attemptedUsernames.delete(socketId)
    socket.emit("usernameSet", { username: trimmedUsername })

    // Broadcast join message
    io.emit("systemMessage", {
      type: "userJoined",
      username: trimmedUsername,
      timestamp: Date.now(),
    })
  })
}
