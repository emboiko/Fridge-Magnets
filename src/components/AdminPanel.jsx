"use client"

import { useState, useEffect, useRef } from "react"
import { useSocket } from "@/src/hooks/useSocket"
import { useAdminStore } from "@/src/stores/adminStore"
import { useMagnetStore } from "@/src/stores/magnetStore"
import {
  ADMIN_PANEL_MIN_WIDTH,
  ADMIN_PANEL_DEFAULT_WIDTH,
  ADMIN_PANEL_MIN_HEIGHT,
  ADMIN_PANEL_DEFAULT_HEIGHT,
  ADMIN_PANEL_MAX_WIDTH_FALLBACK,
  ADMIN_PANEL_MAX_HEIGHT_FALLBACK,
  ADMIN_PANEL_VIEWPORT_PADDING_HORIZONTAL,
  ADMIN_PANEL_VIEWPORT_PADDING_VERTICAL,
  ADMIN_LIST_MIN_HEIGHT,
  ADMIN_LIST_DEFAULT_HEIGHT,
  ADMIN_DATA_REFRESH_INTERVAL_MS,
  ADMIN_RESET_FEEDBACK_DELAY_MS,
  MIN_ADMIN_KICK_TIMEOUT_SECONDS,
  MAX_ADMIN_KICK_TIMEOUT_SECONDS,
  MAGNET_STANDARD_SPRITE_RADIUS,
  MAGNET_ENHANCED_SPRITE_RADIUS,
} from "@/src/lib/constants.js"

const getAdminPanelMaxWidth = () => {
  if (typeof window === "undefined") {
    return ADMIN_PANEL_MAX_WIDTH_FALLBACK
  }
  return Math.floor((window.innerWidth - ADMIN_PANEL_VIEWPORT_PADDING_HORIZONTAL) / 2)
}

const getAdminPanelMaxHeight = () => {
  if (typeof window === "undefined") {
    return ADMIN_PANEL_MAX_HEIGHT_FALLBACK
  }
  return window.innerHeight - ADMIN_PANEL_VIEWPORT_PADDING_VERTICAL
}

const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (mins === 0 && secs === 0) {
      return `${hours}h`
    } else if (secs === 0) {
      return `${hours}h ${mins}m`
    } else {
      return `${hours}h ${mins}m ${secs}s`
    }
  }
}

const formatBytes = (bytes) => {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }
  return `${minutes}m ${secs}s`
}

const getMetricBarClass = (usagePercent) => {
  if (usagePercent >= 75) {
    return "admin-panel-metric-bar-fill-high"
  }
  if (usagePercent >= 50) {
    return "admin-panel-metric-bar-fill-medium"
  }
  return "admin-panel-metric-bar-fill-low"
}

export default function AdminPanel() {
  const socket = useSocket()
  const currentSocketId = socket?.id || null
  const isAdminAuthenticated = useAdminStore((state) => state.isAdminAuthenticated)
  const isAdminPanelOpen = useAdminStore((state) => state.isAdminPanelOpen)
  const closeAdminPanel = useAdminStore((state) => state.closeAdminPanel)
  const isSelectingSummonCoordinates = useAdminStore((state) => state.isSelectingSummonCoordinates)
  const summonCoordinates = useAdminStore((state) => state.summonCoordinates)
  const setSelectingSummonCoordinates = useAdminStore(
    (state) => state.setSelectingSummonCoordinates
  )
  const getLetterLookup = useMagnetStore((state) => state.getLetterLookup)
  const getSpriteLookup = useMagnetStore((state) => state.getSpriteLookup)
  const getAvailableSprites = useMagnetStore((state) => state.getAvailableSprites)
  const [useClosestLetters, setUseClosestLetters] = useState(true)
  const [showSpriteList, setShowSpriteList] = useState(false)
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [movements, setMovements] = useState([])
  const [kickedIPs, setKickedIPs] = useState([])
  const [bannedIPs, setBannedIPs] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [panelWidth, setPanelWidth] = useState(ADMIN_PANEL_DEFAULT_WIDTH)
  const [panelHeight, setPanelHeight] = useState(ADMIN_PANEL_DEFAULT_HEIGHT)
  const [isResizingWidth, setIsResizingWidth] = useState(false)
  const [isResizingHeight, setIsResizingHeight] = useState(false)
  const [usersListHeight, setUsersListHeight] = useState(ADMIN_LIST_DEFAULT_HEIGHT)
  const [movementsListHeight, setMovementsListHeight] = useState(ADMIN_LIST_DEFAULT_HEIGHT)
  const [kickedIPsListHeight, setKickedIPsListHeight] = useState(ADMIN_LIST_DEFAULT_HEIGHT)
  const [bannedIPsListHeight, setBannedIPsListHeight] = useState(ADMIN_LIST_DEFAULT_HEIGHT)
  const [isResizingUsersList, setIsResizingUsersList] = useState(false)
  const [isResizingMovementsList, setIsResizingMovementsList] = useState(false)
  const [isResizingKickedIPsList, setIsResizingKickedIPsList] = useState(false)
  const [isResizingBannedIPsList, setIsResizingBannedIPsList] = useState(false)
  const [magnetsToSummon, setMagnetsToSummon] = useState("")
  const panelRef = useRef(null)
  const usersListRef = useRef(null)
  const movementsListRef = useRef(null)
  const kickedIPsListRef = useRef(null)
  const bannedIPsListRef = useRef(null)
  const currentWidthRef = useRef(panelWidth)
  const currentHeightRef = useRef(panelHeight)
  const currentUsersListHeightRef = useRef(usersListHeight)
  const currentMovementsListHeightRef = useRef(movementsListHeight)
  const currentKickedIPsListHeightRef = useRef(kickedIPsListHeight)
  const currentBannedIPsListHeightRef = useRef(bannedIPsListHeight)

  useEffect(() => {
    currentWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    currentHeightRef.current = panelHeight
  }, [panelHeight])

  useEffect(() => {
    currentUsersListHeightRef.current = usersListHeight
  }, [usersListHeight])

  useEffect(() => {
    currentMovementsListHeightRef.current = movementsListHeight
  }, [movementsListHeight])

  useEffect(() => {
    currentKickedIPsListHeightRef.current = kickedIPsListHeight
  }, [kickedIPsListHeight])

  useEffect(() => {
    currentBannedIPsListHeightRef.current = bannedIPsListHeight
  }, [bannedIPsListHeight])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWidth = localStorage.getItem("adminPanelWidth")
      const storedHeight = localStorage.getItem("adminPanelHeight")
      if (storedWidth) {
        const width = parseInt(storedWidth, 10)
        const maxWidth = getAdminPanelMaxWidth()
        if (width >= ADMIN_PANEL_MIN_WIDTH && width <= maxWidth) {
          setPanelWidth(width)
          currentWidthRef.current = width
        }
      }
      if (storedHeight) {
        const height = parseInt(storedHeight, 10)
        const maxHeight = getAdminPanelMaxHeight()
        if (height >= ADMIN_PANEL_MIN_HEIGHT && height <= maxHeight) {
          setPanelHeight(height)
          currentHeightRef.current = height
        }
      }

      const storedUsersListHeight = localStorage.getItem("adminUsersListHeight")
      const storedMovementsListHeight = localStorage.getItem("adminMovementsListHeight")
      const storedKickedIPsListHeight = localStorage.getItem("adminKickedIPsListHeight")
      const storedBannedIPsListHeight = localStorage.getItem("adminBannedIPsListHeight")

      if (storedUsersListHeight) {
        const height = parseInt(storedUsersListHeight, 10)
        if (height >= ADMIN_LIST_MIN_HEIGHT) {
          setUsersListHeight(height)
          currentUsersListHeightRef.current = height
        }
      }
      if (storedMovementsListHeight) {
        const height = parseInt(storedMovementsListHeight, 10)
        if (height >= ADMIN_LIST_MIN_HEIGHT) {
          setMovementsListHeight(height)
          currentMovementsListHeightRef.current = height
        }
      }
      if (storedKickedIPsListHeight) {
        const height = parseInt(storedKickedIPsListHeight, 10)
        if (height >= ADMIN_LIST_MIN_HEIGHT) {
          setKickedIPsListHeight(height)
          currentKickedIPsListHeightRef.current = height
        }
      }
      if (storedBannedIPsListHeight) {
        const height = parseInt(storedBannedIPsListHeight, 10)
        if (height >= ADMIN_LIST_MIN_HEIGHT) {
          setBannedIPsListHeight(height)
          currentBannedIPsListHeightRef.current = height
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!socket || !isAdminPanelOpen || !isAdminAuthenticated) {
      return
    }

    const handleUsersList = (data) => {
      const sortedUsers = [...data.users].sort((a, b) => {
        const aIsCurrent = a.socketId === socket?.id
        const bIsCurrent = b.socketId === socket?.id
        if (aIsCurrent && !bIsCurrent) {
          return -1
        }
        if (!aIsCurrent && bIsCurrent) {
          return 1
        }
        return 0
      })
      setUsers(sortedUsers)
      setTotalCount(data.totalCount)
    }

    const handleMovementsList = (data) => {
      setMovements(data.movements)
    }

    const handleKickedIPsList = (data) => {
      setKickedIPs(data.kickedIPs)
    }

    const handleBannedIPsList = (data) => {
      setBannedIPs(data.bannedIPs)
    }

    const handleMetrics = (data) => {
      setMetrics(data)
    }

    const handleActionResult = (data) => {
      if (data.success) {
        refreshData()
      }
    }

    socket.on("adminUsersList", handleUsersList)
    socket.on("adminMovementsList", handleMovementsList)
    socket.on("adminKickedIPsList", handleKickedIPsList)
    socket.on("adminBannedIPsList", handleBannedIPsList)
    socket.on("adminMetrics", handleMetrics)
    socket.on("adminActionResult", handleActionResult)

    const refreshData = () => {
      socket.emit("adminGetUsers")
      socket.emit("adminGetMovements")
      socket.emit("adminGetKickedIPs")
      socket.emit("adminGetBannedIPs")
      socket.emit("adminGetMetrics")
    }

    refreshData()
    const interval = setInterval(refreshData, ADMIN_DATA_REFRESH_INTERVAL_MS)

    return () => {
      socket.off("adminUsersList", handleUsersList)
      socket.off("adminMovementsList", handleMovementsList)
      socket.off("adminKickedIPsList", handleKickedIPsList)
      socket.off("adminBannedIPsList", handleBannedIPsList)
      socket.off("adminMetrics", handleMetrics)
      socket.off("adminActionResult", handleActionResult)
      clearInterval(interval)
    }
  }, [socket, isAdminPanelOpen, isAdminAuthenticated])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!panelRef.current) {
        return
      }

      if (isResizingWidth) {
        const panelRect = panelRef.current.getBoundingClientRect()
        const newWidth = panelRect.right - e.clientX
        const maxWidth = getAdminPanelMaxWidth()
        const clampedWidth = Math.max(ADMIN_PANEL_MIN_WIDTH, Math.min(maxWidth, newWidth))
        currentWidthRef.current = clampedWidth
        // Direct DOM manipulation to avoid re-renders during resize
        panelRef.current.style.width = `${clampedWidth}px`
      }

      if (isResizingHeight) {
        const panelRect = panelRef.current.getBoundingClientRect()
        const newHeight = panelRect.bottom - e.clientY
        const maxHeight = getAdminPanelMaxHeight()
        const clampedHeight = Math.max(ADMIN_PANEL_MIN_HEIGHT, Math.min(maxHeight, newHeight))
        currentHeightRef.current = clampedHeight
        // Direct DOM manipulation to avoid re-renders during resize
        panelRef.current.style.height = `${clampedHeight}px`
      }
    }

    const handleMouseUp = () => {
      // Sync React state and localStorage only when resize ends
      if (isResizingWidth) {
        setPanelWidth(currentWidthRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem("adminPanelWidth", currentWidthRef.current.toString())
        }
      }
      if (isResizingHeight) {
        setPanelHeight(currentHeightRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem("adminPanelHeight", currentHeightRef.current.toString())
        }
      }
      setIsResizingWidth(false)
      setIsResizingHeight(false)
    }

    if (isResizingWidth || isResizingHeight) {
      // Add class to disable width/height transitions during resize
      if (panelRef.current) {
        panelRef.current.classList.add("admin-panel-resizing")
      }
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        // Remove class when resize ends
        if (panelRef.current) {
          panelRef.current.classList.remove("admin-panel-resizing")
        }
      }
    } else {
      // Ensure class is removed when not resizing
      if (panelRef.current) {
        panelRef.current.classList.remove("admin-panel-resizing")
      }
    }
  }, [isResizingWidth, isResizingHeight])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingUsersList && usersListRef.current) {
        const listRect = usersListRef.current.getBoundingClientRect()
        const newHeight = e.clientY - listRect.top
        const clampedHeight = Math.max(ADMIN_LIST_MIN_HEIGHT, newHeight)
        currentUsersListHeightRef.current = clampedHeight
        // Direct DOM manipulation to avoid re-renders during resize
        usersListRef.current.style.height = `${clampedHeight}px`
      }

      if (isResizingMovementsList && movementsListRef.current) {
        const listRect = movementsListRef.current.getBoundingClientRect()
        const newHeight = e.clientY - listRect.top
        const clampedHeight = Math.max(ADMIN_LIST_MIN_HEIGHT, newHeight)
        currentMovementsListHeightRef.current = clampedHeight
        // Direct DOM manipulation to avoid re-renders during resize
        movementsListRef.current.style.height = `${clampedHeight}px`
      }

      if (isResizingKickedIPsList && kickedIPsListRef.current) {
        const listRect = kickedIPsListRef.current.getBoundingClientRect()
        const newHeight = e.clientY - listRect.top
        const clampedHeight = Math.max(ADMIN_LIST_MIN_HEIGHT, newHeight)
        currentKickedIPsListHeightRef.current = clampedHeight
        // Direct DOM manipulation to avoid re-renders during resize
        kickedIPsListRef.current.style.height = `${clampedHeight}px`
      }

      if (isResizingBannedIPsList && bannedIPsListRef.current) {
        const listRect = bannedIPsListRef.current.getBoundingClientRect()
        const newHeight = e.clientY - listRect.top
        const clampedHeight = Math.max(ADMIN_LIST_MIN_HEIGHT, newHeight)
        currentBannedIPsListHeightRef.current = clampedHeight
        // Direct DOM manipulation to avoid re-renders during resize
        bannedIPsListRef.current.style.height = `${clampedHeight}px`
      }
    }

    const handleMouseUp = () => {
      // Sync React state and localStorage only when resize ends
      if (isResizingUsersList) {
        setUsersListHeight(currentUsersListHeightRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem("adminUsersListHeight", currentUsersListHeightRef.current.toString())
        }
        setIsResizingUsersList(false)
      }
      if (isResizingMovementsList) {
        setMovementsListHeight(currentMovementsListHeightRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "adminMovementsListHeight",
            currentMovementsListHeightRef.current.toString()
          )
        }
        setIsResizingMovementsList(false)
      }
      if (isResizingKickedIPsList) {
        setKickedIPsListHeight(currentKickedIPsListHeightRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "adminKickedIPsListHeight",
            currentKickedIPsListHeightRef.current.toString()
          )
        }
        setIsResizingKickedIPsList(false)
      }
      if (isResizingBannedIPsList) {
        setBannedIPsListHeight(currentBannedIPsListHeightRef.current)
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "adminBannedIPsListHeight",
            currentBannedIPsListHeightRef.current.toString()
          )
        }
        setIsResizingBannedIPsList(false)
      }
    }

    if (
      isResizingUsersList ||
      isResizingMovementsList ||
      isResizingKickedIPsList ||
      isResizingBannedIPsList
    ) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [
    isResizingUsersList,
    isResizingMovementsList,
    isResizingKickedIPsList,
    isResizingBannedIPsList,
  ])

  if (!isAdminAuthenticated) {
    return null
  }

  if (!socket) {
    return null
  }

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

  const handleResizeListStart = (setIsResizing) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }

  const handleKick = (socketId) => {
    const timeoutInput = prompt(
      `Enter kick duration in seconds (${MIN_ADMIN_KICK_TIMEOUT_SECONDS}-${MAX_ADMIN_KICK_TIMEOUT_SECONDS}):`
    )
    if (!timeoutInput) {
      return
    }

    const timeoutSeconds = parseInt(timeoutInput, 10)
    if (
      isNaN(timeoutSeconds) ||
      timeoutSeconds < MIN_ADMIN_KICK_TIMEOUT_SECONDS ||
      timeoutSeconds > MAX_ADMIN_KICK_TIMEOUT_SECONDS
    ) {
      alert(
        `Invalid timeout. Please enter a number between ${MIN_ADMIN_KICK_TIMEOUT_SECONDS} and ${MAX_ADMIN_KICK_TIMEOUT_SECONDS}.`
      )
      return
    }

    const message = prompt("Enter kick message (optional):") || undefined

    socket.emit("adminKickUser", { socketId, timeoutSeconds, message })
  }

  const handleBan = (socketId) => {
    if (!confirm("Are you sure you want to permanently ban this user?")) {
      return
    }

    const reason = prompt("Enter ban reason (optional):") || undefined

    socket.emit("adminBanUser", { socketId, reason })
  }

  const handleUnban = (ipAddress) => {
    if (!confirm(`Are you sure you want to unban ${ipAddress}?`)) {
      return
    }

    socket.emit("adminUnbanIP", { ipAddress })
  }

  const handleResetFridge = () => {
    if (
      !confirm("Are you sure you want to reset the fridge? This will reset all magnet positions.")
    ) {
      return
    }

    setIsResetting(true)
    socket.emit("adminResetFridge")
    setTimeout(() => {
      setIsResetting(false)
    }, ADMIN_RESET_FEEDBACK_DELAY_MS)
  }

  const handleStartCoordinateSelection = () => {
    setSelectingSummonCoordinates(true)
  }

  const handleStopCoordinateSelection = () => {
    setSelectingSummonCoordinates(false)
  }

  const handleSummonMagnets = async () => {
    if (summonCoordinates.x === null || summonCoordinates.y === null) {
      alert("Please set coordinates first by clicking on the canvas")
      return
    }

    if (!magnetsToSummon.trim()) {
      alert("Please enter text to summon")
      return
    }

    const input = magnetsToSummon.trim()
    const letterLookup = getLetterLookup(
      summonCoordinates.x,
      summonCoordinates.y,
      useClosestLetters
    )
    const spriteLookup = getSpriteLookup(
      summonCoordinates.x,
      summonCoordinates.y,
      useClosestLetters
    )

    // Parse input: split by single quotes to separate sprites from letters
    // Format: "hello'yoshi_running'😁" -> ["hello", "yoshi_running", "😁"]
    const parts = []
    let currentPart = ""
    let inQuotes = false

    for (let i = 0; i < input.length; i++) {
      const char = input[i]
      if (char === "'") {
        if (inQuotes) {
          // End of sprite name
          if (currentPart) {
            parts.push({ type: "sprite", value: currentPart.toLowerCase() })
            currentPart = ""
          }
          inQuotes = false
        } else {
          // Start of sprite name - save any accumulated letters first
          if (currentPart) {
            parts.push({ type: "text", value: currentPart })
            currentPart = ""
          }
          inQuotes = true
        }
      } else {
        currentPart += char
      }
    }

    // Add remaining part
    if (currentPart) {
      if (inQuotes) {
        parts.push({ type: "sprite", value: currentPart.toLowerCase() })
      } else {
        parts.push({ type: "text", value: currentPart })
      }
    }

    const missingItems = []
    const foundItems = [] // { index, radius }
    const usedCountPerLetter = new Map()
    const usedCountPerSprite = new Map()

    for (const part of parts) {
      if (part.type === "text") {
        // Process each character in the text
        for (const char of part.value) {
          const normalizedChar = char.toUpperCase()
          const letterMagnets = letterLookup.get(normalizedChar)
          if (!letterMagnets || letterMagnets.length === 0) {
            missingItems.push(char)
          } else {
            const usedCount = usedCountPerLetter.get(normalizedChar) || 0
            if (usedCount >= letterMagnets.length) {
              missingItems.push(char)
            } else {
              const magnetData = letterMagnets[usedCount]
              foundItems.push({
                index: magnetData.index,
                radius: MAGNET_STANDARD_SPRITE_RADIUS,
              })
              usedCountPerLetter.set(normalizedChar, usedCount + 1)
            }
          }
        }
      } else {
        // Process sprite
        const spriteName = part.value
        const spriteMagnets = spriteLookup.get(spriteName)
        if (!spriteMagnets || spriteMagnets.length === 0) {
          missingItems.push(`'${spriteName}'`)
        } else {
          const usedCount = usedCountPerSprite.get(spriteName) || 0
          if (usedCount >= spriteMagnets.length) {
            missingItems.push(`'${spriteName}'`)
          } else {
            const magnetData = spriteMagnets[usedCount]
            foundItems.push({
              index: magnetData.index,
              radius: magnetData.radius,
            })
            usedCountPerSprite.set(spriteName, usedCount + 1)
          }
        }
      }
    }

    if (missingItems.length > 0) {
      const uniqueMissing = [...new Set(missingItems)]
      alert(
        `Cannot summon: the following items are not available on the canvas: ${uniqueMissing.join(", ")}`
      )
      return
    }

    if (foundItems.length === 0) {
      alert("No magnets found for the entered text")
      return
    }

    // Calculate positions with proper spacing based on radius
    let currentX = summonCoordinates.x
    for (let i = 0; i < foundItems.length; i++) {
      const item = foundItems[i]
      const spacing = item.radius + 10 // 10 = padding between magnets
      socket.emit("magnetMove", {
        x: currentX,
        y: summonCoordinates.y,
        magnetIndex: item.index,
      })
      currentX += spacing
    }

    setMagnetsToSummon("")
  }

  if (!isAdminPanelOpen) {
    return null
  }

  return (
    <div
      className="admin-panel"
      ref={panelRef}
      style={{ width: `${panelWidth}px`, height: `${panelHeight}px` }}
    >
      <div className="admin-panel-header">
        <div
          className="admin-panel-resize-handle-height"
          onMouseDown={handleResizeHeightStart}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <h2 className="admin-panel-title">Administrator</h2>
        <button className="panel-close-button" onClick={closeAdminPanel}>
          ×
        </button>
      </div>

      <div className="admin-panel-content">
        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title admin-panel-section-title-blue">
            Connected Users ({totalCount})
          </h3>
          <div className="admin-panel-list-wrapper">
            <div
              className="admin-panel-list"
              ref={usersListRef}
              style={{ height: `${usersListHeight}px` }}
            >
              {users.length === 0 ? (
                <div className="admin-panel-empty">No users connected</div>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.socketId === currentSocketId
                  const hasAttemptedUsername = user.attemptedUsername && !user.username
                  const displayUsername = user.username || "No username"

                  // Split username to highlight the number if it's an attempted username
                  let usernameParts = null
                  if (hasAttemptedUsername && user.username) {
                    const match = user.username.match(/^(.+?)\s+(\d+)$/)
                    if (match) {
                      usernameParts = { base: match[1], number: match[2] }
                    }
                  }

                  return (
                    <div
                      key={user.socketId}
                      className={`admin-panel-user-item ${isCurrentUser ? "admin-panel-user-item-current" : ""}`}
                    >
                      <div className="admin-panel-user-info">
                        <div className="admin-panel-user-id">{user.socketId}</div>
                        <div className="admin-panel-user-details">
                          <div>
                            {usernameParts ? (
                              <>
                                {usernameParts.base}{" "}
                                <span className="admin-panel-username-number">
                                  {usernameParts.number}
                                </span>
                              </>
                            ) : (
                              displayUsername
                            )}
                          </div>
                          <div className="admin-panel-user-ip">{user.ipAddress}</div>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <div className="admin-panel-user-actions">
                          <button
                            className="admin-panel-action-button admin-panel-kick-button"
                            onClick={() => handleKick(user.socketId)}
                          >
                            Kick
                          </button>
                          <button
                            className="admin-panel-action-button admin-panel-ban-button"
                            onClick={() => handleBan(user.socketId)}
                          >
                            Ban
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div
              className="admin-panel-resize-handle-list"
              onMouseDown={handleResizeListStart(setIsResizingUsersList)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title admin-panel-section-title-orange">
            Active Movements
          </h3>
          <div className="admin-panel-list-wrapper">
            <div
              className="admin-panel-list"
              ref={movementsListRef}
              style={{ height: `${movementsListHeight}px` }}
            >
              {movements.length === 0 ? (
                <div className="admin-panel-empty">No active movements</div>
              ) : (
                movements.map((movement) => (
                  <div key={movement.socketId} className="admin-panel-movement-item">
                    <div className="admin-panel-movement-info">
                      <div className="admin-panel-movement-user">
                        {movement.username || movement.socketId}
                      </div>
                      <div className="admin-panel-movement-magnet">
                        Moving &nbsp;<span>"{movement.magnetDisplay}"&nbsp;</span> (#
                        {movement.magnetIndex})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div
              className="admin-panel-resize-handle-list"
              onMouseDown={handleResizeListStart(setIsResizingMovementsList)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title admin-panel-section-title-red">Kicked IPs</h3>
          <div className="admin-panel-list-wrapper">
            <div
              className="admin-panel-list"
              ref={kickedIPsListRef}
              style={{ height: `${kickedIPsListHeight}px` }}
            >
              {kickedIPs.length === 0 ? (
                <div className="admin-panel-empty">No kicked IPs</div>
              ) : (
                kickedIPs.map((kicked) => {
                  return (
                    <div key={kicked.ipAddress} className="admin-panel-kicked-item">
                      <div className="admin-panel-kicked-info">
                        <div className="admin-panel-kicked-ip">{kicked.ipAddress}</div>
                        {kicked.message && (
                          <div className="admin-panel-kicked-message">
                            Message: {kicked.message}
                          </div>
                        )}
                        <div className="admin-panel-kicked-time">
                          Remaining:{" "}
                          <span className="admin-panel-kicked-time-value">
                            {formatTime(kicked.remainingSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div
              className="admin-panel-resize-handle-list"
              onMouseDown={handleResizeListStart(setIsResizingKickedIPsList)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title admin-panel-section-title-red">Banned IPs</h3>
          <div className="admin-panel-list-wrapper">
            <div
              className="admin-panel-list"
              ref={bannedIPsListRef}
              style={{ height: `${bannedIPsListHeight}px` }}
            >
              {bannedIPs.length === 0 ? (
                <div className="admin-panel-empty">No banned IPs</div>
              ) : (
                bannedIPs.map((banned) => (
                  <div key={banned.ipAddress} className="admin-panel-banned-item">
                    <div className="admin-panel-banned-info">
                      <div className="admin-panel-banned-ip">{banned.ipAddress}</div>
                      {banned.reason && (
                        <div className="admin-panel-banned-reason">Reason: {banned.reason}</div>
                      )}
                      <div className="admin-panel-banned-date">
                        Banned: {new Date(banned.bannedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="admin-panel-action-button admin-panel-unban-button"
                      onClick={() => handleUnban(banned.ipAddress)}
                    >
                      Unban
                    </button>
                  </div>
                ))
              )}
            </div>
            <div
              className="admin-panel-resize-handle-list"
              onMouseDown={handleResizeListStart(setIsResizingBannedIPsList)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title admin-panel-section-title-actions">Actions</h3>
          <div className="admin-panel-actions-content">
            <div className="admin-panel-action-group">
              <button
                className="admin-panel-reset-button"
                onClick={handleResetFridge}
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Reset Fridge"}
              </button>
            </div>
            <div className="admin-panel-action-group admin-panel-summon-group">
              <div className="admin-panel-summon-coordinates">
                <div className="admin-panel-summon-coordinates-header">
                  <label className="admin-panel-summon-label">Summon Coordinates</label>
                  {summonCoordinates.x !== null && summonCoordinates.y !== null ? (
                    <div className="admin-panel-summon-coordinates-display">
                      ({summonCoordinates.x}, {summonCoordinates.y})
                    </div>
                  ) : (
                    <div className="admin-panel-summon-coordinates-placeholder">Not set</div>
                  )}
                </div>
                {isSelectingSummonCoordinates ? (
                  <button
                    className="admin-panel-summon-coordinate-button admin-panel-summon-coordinate-button-active"
                    onClick={handleStopCoordinateSelection}
                  >
                    Cancel Selection
                  </button>
                ) : (
                  <button
                    className="admin-panel-summon-coordinate-button"
                    onClick={handleStartCoordinateSelection}
                  >
                    Click Canvas to Set
                  </button>
                )}
              </div>
              <div className="admin-panel-summon-magnets">
                <div className="admin-panel-summon-magnets-header">
                  <label className="admin-panel-summon-label">Text to Summon</label>
                  <div className="admin-panel-summon-controls-row">
                    <div className="admin-panel-summon-letter-mode">
                      <label className="admin-panel-summon-letter-mode-label">
                        <input
                          type="checkbox"
                          checked={useClosestLetters}
                          onChange={(e) => setUseClosestLetters(e.target.checked)}
                        />
                        <span>Use closest</span>
                      </label>
                    </div>
                    <button
                      className="admin-panel-sprite-list-button"
                      onClick={() => setShowSpriteList(!showSpriteList)}
                    >
                      {showSpriteList ? "Hide" : "Show"} Sprites
                    </button>
                  </div>
                </div>
                {showSpriteList && (
                  <div className="admin-panel-sprite-list">
                    <div className="admin-panel-sprite-list-label">Available sprites:</div>
                    <div className="admin-panel-sprite-list-items">
                      {getAvailableSprites().map((sprite) => (
                        <button
                          key={sprite}
                          className="admin-panel-sprite-item"
                          onClick={() => {
                            const current = magnetsToSummon
                            const cursorPos =
                              document.activeElement?.selectionStart || current.length
                            const before = current.slice(0, cursorPos)
                            const after = current.slice(cursorPos)
                            setMagnetsToSummon(`${before}'${sprite}'${after}`)
                            setTimeout(() => {
                              const input = document.querySelector(".admin-panel-summon-input")
                              if (input) {
                                const newPos = cursorPos + sprite.length + 2
                                input.setSelectionRange(newPos, newPos)
                                input.focus()
                              }
                            }, 0)
                          }}
                          title={`Click to insert '${sprite}'`}
                        >
                          {sprite}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="admin-panel-summon-magnets-controls">
                  <input
                    type="text"
                    className="admin-panel-summon-input"
                    value={magnetsToSummon}
                    onChange={(e) => setMagnetsToSummon(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                    }}
                    onKeyUp={(e) => {
                      e.stopPropagation()
                    }}
                  />
                  <button className="admin-panel-summon-button" onClick={handleSummonMagnets}>
                    Summon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title admin-panel-section-title-blue">Metrics</h3>
          {metrics ? (
            <div className="admin-panel-metrics">
              <div className="admin-panel-metric-item">
                <div className="admin-panel-metric-label">Memory Usage</div>
                <div className="admin-panel-metric-value">
                  {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)} (
                  {metrics.memory.usagePercent.toFixed(1)}%)
                </div>
                <div className="admin-panel-metric-bar">
                  <div
                    className={`admin-panel-metric-bar-fill ${getMetricBarClass(metrics.memory.usagePercent)}`}
                    style={{ width: `${metrics.memory.usagePercent}%` }}
                  />
                </div>
              </div>
              <div className="admin-panel-metric-item">
                <div className="admin-panel-metric-label">CPU Usage</div>
                <div className="admin-panel-metric-value">
                  {metrics.cpu.count} cores - {metrics.cpu.model}
                </div>
                {metrics.cpu.usagePercent !== undefined && (
                  <>
                    <div className="admin-panel-metric-value">
                      {metrics.cpu.usagePercent.toFixed(1)}%
                    </div>
                    <div className="admin-panel-metric-bar">
                      <div
                        className={`admin-panel-metric-bar-fill ${getMetricBarClass(metrics.cpu.usagePercent)}`}
                        style={{ width: `${metrics.cpu.usagePercent}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="admin-panel-metric-item">
                <div className="admin-panel-metric-label">Uptime</div>
                <div className="admin-panel-metric-value">{formatUptime(metrics.uptime)}</div>
              </div>
            </div>
          ) : (
            <div className="admin-panel-empty">Loading metrics...</div>
          )}
        </div>
      </div>

      <div
        className="admin-panel-resize-handle-width"
        onMouseDown={handleResizeWidthStart}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  )
}
