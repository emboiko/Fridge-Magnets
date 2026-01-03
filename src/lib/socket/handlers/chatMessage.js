import { chatMessageSchema } from "../../validation/socketSchemas.js"
import { CHAT_RATE_LIMIT_WINDOW_MS, CHAT_RATE_LIMIT_MAX_MESSAGES } from "../../constants.js"

/**
 * Handles chat message events
 */
export function handleChatMessage(socket, context) {
  const { socketId, clientIp, chatRateLimitMap, socketUsernames, io } = context

  socket.on("chatMessage", (data) => {
    const chatRateLimit = chatRateLimitMap.get(socketId)
    const now = Date.now()
    if (now > chatRateLimit.resetTime) {
      chatRateLimit.count = 0
      chatRateLimit.resetTime = now + CHAT_RATE_LIMIT_WINDOW_MS
    }

    if (chatRateLimit.count >= CHAT_RATE_LIMIT_MAX_MESSAGES) {
      if (chatRateLimit.count === CHAT_RATE_LIMIT_MAX_MESSAGES) {
        console.warn(
          `Chat rate limit exceeded for socket ${socketId} from ${clientIp} (${CHAT_RATE_LIMIT_MAX_MESSAGES} messages per ${CHAT_RATE_LIMIT_WINDOW_MS / 1000} seconds)`
        )
      }
      socket.emit("error", { message: "Chat rate limit exceeded. Please slow down." })
      return
    }

    chatRateLimit.count++

    const validationResult = chatMessageSchema.safeParse(data)
    if (!validationResult.success) {
      console.error(`Invalid chatMessage data from ${clientIp}:`, validationResult.error)
      socket.emit("error", { message: "Invalid chat message format" })
      return
    }

    // Use the username from socketUsernames map (server-side source of truth)
    const serverUsername = socketUsernames.get(socketId)
    if (!serverUsername) {
      socket.emit("error", { message: "You must set a username before sending messages" })
      return
    }

    const { message } = validationResult.data
    const chatData = {
      username: serverUsername,
      message,
      timestamp: Date.now(),
    }

    // Broadcast to all clients including sender
    io.emit("chatMessage", chatData)
  })
}
