"use client"

import { useState, useEffect, useRef } from "react"
import { useSocket } from "@/src/hooks/useSocket"
import { useUIStore } from "@/src/stores/uiStore"
import {
  CHAT_MIN_WIDTH,
  CHAT_DEFAULT_WIDTH,
  CHAT_MIN_HEIGHT,
  CHAT_DEFAULT_HEIGHT,
  CHAT_MAX_WIDTH_FALLBACK,
  CHAT_MAX_HEIGHT_FALLBACK,
  CHAT_VIEWPORT_PADDING_HORIZONTAL,
  CHAT_VIEWPORT_PADDING_VERTICAL,
  CHAT_NAME_PROMPT_WIDTH,
  CHAT_NAME_PROMPT_HEIGHT,
  MAX_USERNAME_LENGTH,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/src/lib/constants.js"

const getChatMaxWidth = () => {
  if (typeof window === "undefined") {
    return CHAT_MAX_WIDTH_FALLBACK
  }
  return Math.floor((window.innerWidth - CHAT_VIEWPORT_PADDING_HORIZONTAL) / 2)
}

const getChatMaxHeight = () => {
  if (typeof window === "undefined") {
    return CHAT_MAX_HEIGHT_FALLBACK
  }
  return window.innerHeight - CHAT_VIEWPORT_PADDING_VERTICAL
}

export default function Chat() {
  const socket = useSocket()
  const isOpen = useUIStore((state) => state.isChatOpen)
  const shouldFocus = useUIStore((state) => state.shouldFocusChat)
  const closeChat = useUIStore((state) => state.closeChat)
  const setShouldFocusChat = useUIStore((state) => state.setShouldFocusChat)
  const [username, setUsername] = useState("")
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [nameError, setNameError] = useState("")
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT_WIDTH)
  const [chatHeight, setChatHeight] = useState(CHAT_DEFAULT_HEIGHT)
  const [isResizingWidth, setIsResizingWidth] = useState(false)
  const [isResizingHeight, setIsResizingHeight] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const nameInputRef = useRef(null)
  const chatPanelRef = useRef(null)
  const currentWidthRef = useRef(chatWidth)
  const currentHeightRef = useRef(chatHeight)

  useEffect(() => {
    currentWidthRef.current = chatWidth
  }, [chatWidth])

  useEffect(() => {
    currentHeightRef.current = chatHeight
  }, [chatHeight])

  // Ensure chat-resizing class is properly managed
  useEffect(() => {
    if (chatPanelRef.current) {
      if (isResizingWidth || isResizingHeight) {
        chatPanelRef.current.classList.add("chat-resizing")
      } else {
        chatPanelRef.current.classList.remove("chat-resizing")
      }
    }
  }, [isResizingWidth, isResizingHeight])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWidth = localStorage.getItem("chatWidth")
      const storedHeight = localStorage.getItem("chatHeight")
      if (storedWidth) {
        const width = parseInt(storedWidth, 10)
        const maxWidth = getChatMaxWidth()
        if (width >= CHAT_MIN_WIDTH && width <= maxWidth) {
          setChatWidth(width)
          currentWidthRef.current = width
        }
      }
      if (storedHeight) {
        const height = parseInt(storedHeight, 10)
        const maxHeight = getChatMaxHeight()
        if (height >= CHAT_MIN_HEIGHT && height <= maxHeight) {
          setChatHeight(height)
          currentHeightRef.current = height
        }
      }
    }
  }, [])

  useEffect(() => {
    if (socket && typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("chatUsername")
      if (storedUsername) {
        setUsername(storedUsername)
        // Set username on server when socket is ready
        socket.emit("setUsername", { username: storedUsername })
      }
    }
  }, [socket])

  useEffect(() => {
    if (!socket) {
      return
    }

    const handleChatMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, { ...data, type: "chat" }])
    }

    const handleSystemMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, { ...data, messageType: "system" }])
    }

    const handleUsernameSet = (data) => {
      setUsername(data.username)
      setNameError("")
      if (typeof window !== "undefined") {
        localStorage.setItem("chatUsername", data.username)
      }
    }

    const handleUsernameError = (data) => {
      setNameError(data.message)
    }

    socket.on("chatMessage", handleChatMessage)
    socket.on("systemMessage", handleSystemMessage)
    socket.on("usernameSet", handleUsernameSet)
    socket.on("usernameError", handleUsernameError)

    return () => {
      socket.off("chatMessage", handleChatMessage)
      socket.off("systemMessage", handleSystemMessage)
      socket.off("usernameSet", handleUsernameSet)
      socket.off("usernameError", handleUsernameError)
    }
  }, [socket])

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen && shouldFocus) {
      const inputToFocus = username ? inputRef.current : nameInputRef.current
      if (inputToFocus) {
        inputToFocus.focus()
        setShouldFocusChat(false)
      }
    }
  }, [isOpen, username, shouldFocus, setShouldFocusChat])

  const handleNameSubmit = (e) => {
    e.preventDefault()
    const trimmedName = nameInput.trim()
    if (trimmedName.length > 0 && trimmedName.length <= MAX_USERNAME_LENGTH && socket) {
      socket.emit("setUsername", { username: trimmedName })
      setNameError("")
      setNameInput("")
    }
  }

  const handleMessageSubmit = (e) => {
    e.preventDefault()
    const trimmedMessage = inputMessage.trim()
    if (
      trimmedMessage.length > 0 &&
      trimmedMessage.length <= MAX_CHAT_MESSAGE_LENGTH &&
      socket &&
      username
    ) {
      socket.emit("chatMessage", {
        message: trimmedMessage,
      })
      setInputMessage("")
    }
  }

  const handleClearUsername = () => {
    if (socket) {
      socket.emit("setUsername", { username: "" })
    }
    setUsername("")
    if (typeof window !== "undefined") {
      localStorage.removeItem("chatUsername")
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!chatPanelRef.current) {
        return
      }

      if (isResizingWidth) {
        const newWidth = e.clientX - chatPanelRef.current.getBoundingClientRect().left
        const maxWidth = getChatMaxWidth()
        const clampedWidth = Math.max(CHAT_MIN_WIDTH, Math.min(maxWidth, newWidth))
        currentWidthRef.current = clampedWidth
        // Direct DOM manipulation to avoid re-renders during resize
        chatPanelRef.current.style.setProperty("--chat-width", `${clampedWidth}px`)
      }

      if (isResizingHeight) {
        const panelRect = chatPanelRef.current.getBoundingClientRect()
        const newHeight = panelRect.bottom - e.clientY
        const maxHeight = getChatMaxHeight()
        const clampedHeight = Math.max(CHAT_MIN_HEIGHT, Math.min(maxHeight, newHeight))
        currentHeightRef.current = clampedHeight
        // Direct DOM manipulation to avoid re-renders during resize
        chatPanelRef.current.style.setProperty("--chat-height", `${clampedHeight}px`)
      }
    }

    const handleMouseUp = () => {
      // Sync React state and localStorage only when resize ends
      if (isResizingWidth) {
        setChatWidth(currentWidthRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem("chatWidth", currentWidthRef.current.toString())
        }
      }
      if (isResizingHeight) {
        setChatHeight(currentHeightRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem("chatHeight", currentHeightRef.current.toString())
        }
      }
      setIsResizingWidth(false)
      setIsResizingHeight(false)
    }

    if (isResizingWidth || isResizingHeight) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizingWidth, isResizingHeight])

  const handleResizeWidthStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingWidth(true)
  }

  const handleResizeHeightStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingHeight(true)
  }

  const handleResizeDiagonalStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingWidth(true)
    setIsResizingHeight(true)
  }

  if (!isOpen) {
    return null
  }

  const displayWidth = username ? chatWidth : CHAT_NAME_PROMPT_WIDTH
  const displayHeight = username ? chatHeight : CHAT_NAME_PROMPT_HEIGHT

  return (
    <div
      className="chat-panel"
      ref={chatPanelRef}
      style={{
        "--chat-width": `${displayWidth}px`,
        "--chat-height": `${displayHeight}px`,
      }}
    >
      {!username ? (
        <div className="chat-name-prompt-wrapper">
          {nameError && <div className="chat-name-error">{nameError}</div>}
          <div className="chat-name-prompt">
            <form onSubmit={handleNameSubmit}>
              <div className="chat-name-input-wrapper">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value)
                    setNameError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") {
                      e.stopPropagation()
                    }
                  }}
                  placeholder="Enter your name to chat"
                  maxLength={MAX_USERNAME_LENGTH}
                  className="chat-name-input"
                />
                <span className="chat-char-count">{MAX_USERNAME_LENGTH - nameInput.length}</span>
              </div>
              <button
                type="submit"
                className="chat-submit-button"
                disabled={nameError !== "" || nameInput.length === 0}
              >
                Set Name
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="chat-header">
            <div
              className="chat-resize-handle-height"
              onMouseDown={handleResizeHeightStart}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <button
              className="chat-clear-name-button"
              onClick={handleClearUsername}
              title="Click to clear name and leave chat"
            >
              <span className="chat-username-display">{username}</span>
            </button>
            <button className="panel-close-button" onClick={closeChat}>
              ×
            </button>
          </div>
          <div
            className="chat-resize-handle-diagonal"
            onMouseDown={handleResizeDiagonalStart}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="chat-messages">
            {messages.map((message, index) => {
              if (message.messageType === "system") {
                return (
                  <div key={index} className="chat-message chat-system-message">
                    <span className="chat-system-text">
                      {message.type === "userJoined" && `${message.username} has joined the chat`}
                      {message.type === "userLeft" && `${message.username} has left the chat`}
                    </span>
                  </div>
                )
              }
              return (
                <div key={index} className="chat-message">
                  <span className="chat-username">{message.username}:</span>
                  <span className="chat-text">{message.message}</span>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleMessageSubmit} className="chat-input-form">
            <div className="chat-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") {
                    e.stopPropagation()
                  }
                }}
                placeholder="Type a message..."
                maxLength={MAX_CHAT_MESSAGE_LENGTH}
                className="chat-input"
              />
              <span className="chat-char-count">
                {MAX_CHAT_MESSAGE_LENGTH - inputMessage.length}
              </span>
            </div>
            <button type="submit" className="chat-submit-button">
              Send
            </button>
          </form>
        </>
      )}
      {username && (
        <div
          className="chat-resize-handle-width"
          onMouseDown={handleResizeWidthStart}
          onKeyDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
