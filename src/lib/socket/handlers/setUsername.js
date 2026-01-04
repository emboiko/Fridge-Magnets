import { MAX_USERNAME_LENGTH } from "../../constants.js"

export function handleSetUsername(socket, context) {
  const { socketId, socketUsernames, activeUsernames, attemptedUsernames, io } = context

  socket.on("setUsername", (data) => {
    const trimmedUsername = data.username?.trim()
    const currentUsername = socketUsernames.get(socketId)

    if (!trimmedUsername || trimmedUsername.length === 0) {
      if (currentUsername) {
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

    if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
      socket.emit("usernameError", {
        message: `Username must be between 1 and ${MAX_USERNAME_LENGTH} characters`,
      })
      return
    }

    const usernameLower = trimmedUsername.toLowerCase()

    if (currentUsername && currentUsername.toLowerCase() === usernameLower) {
      socket.emit("usernameSet", { username: trimmedUsername })
      return
    }

    if (activeUsernames.has(usernameLower)) {
      attemptedUsernames.set(socketId, trimmedUsername)
      socket.emit("usernameError", { message: "Username is already taken" })
      return
    }

    if (currentUsername) {
      activeUsernames.delete(currentUsername.toLowerCase())
      io.emit("systemMessage", {
        type: "userLeft",
        username: currentUsername,
        timestamp: Date.now(),
      })
    }

    socketUsernames.set(socketId, trimmedUsername)
    activeUsernames.add(usernameLower)
    attemptedUsernames.delete(socketId)
    socket.emit("usernameSet", { username: trimmedUsername })

    io.emit("systemMessage", {
      type: "userJoined",
      username: trimmedUsername,
      timestamp: Date.now(),
    })
  })
}
