// Explicitly load .env.local (dotenv/config might not load it by default in custom servers)
import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local"), quiet: true })

// 3rd party:
import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import connectDB from "./src/lib/db/mongoose.js"

// Server entities, schemas, constants, utils, etc.
import { Refrigerator } from "./src/entities/Refrigerator.js"
import { magnetsArraySchema } from "./src/lib/validation/socketSchemas.js"
import { BannedIP } from "./src/lib/db/BannedIP.js"
import { RATE_LIMIT_WINDOW_MS, CHAT_RATE_LIMIT_WINDOW_MS } from "./src/lib/constants.js"
import { validateConnection } from "./src/lib/socket/connectionValidation.js"
import { setupServerIntervals } from "./src/lib/socket/serverIntervals.js"

// Socket handlers:
import { handleSetUsername } from "./src/lib/socket/handlers/setUsername.js"
import { handleMagnetMove } from "./src/lib/socket/handlers/magnetMove.js"
import { handleChatMessage } from "./src/lib/socket/handlers/chatMessage.js"
import { handleAdminAuth } from "./src/lib/socket/handlers/adminAuth.js"
import { handleAdminGetUsers } from "./src/lib/socket/handlers/adminGetUsers.js"
import { handleAdminKickUser } from "./src/lib/socket/handlers/adminKickUser.js"
import { handleAdminBanUser } from "./src/lib/socket/handlers/adminBanUser.js"
import { handleAdminUnbanIP } from "./src/lib/socket/handlers/adminUnbanIP.js"
import { handleAdminGetKickedIPs } from "./src/lib/socket/handlers/adminGetKickedIPs.js"
import { handleAdminGetBannedIPs } from "./src/lib/socket/handlers/adminGetBannedIPs.js"
import { handleAdminResetFridge } from "./src/lib/socket/handlers/adminResetFridge.js"
import { handleAdminGetMovements } from "./src/lib/socket/handlers/adminGetMovements.js"
import { handleAdminGetMetrics } from "./src/lib/socket/handlers/adminGetMetrics.js"
import { handleDisconnect } from "./src/lib/socket/handlers/disconnect.js"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Connect to DB and init fridge
  await connectDB()
  const refrigerator = new Refrigerator()
  await refrigerator.loadMagnets()

  // Load banned IPs from database
  const bannedIPsSet = new Set()
  try {
    const bannedIPs = await BannedIP.find({})
    bannedIPs.forEach((doc) => {
      bannedIPsSet.add(doc.ipAddress)
    })
    console.info(`Loaded ${bannedIPsSet.size} banned IP(s) from database`)
  } catch (error) {
    console.error("Error loading banned IPs:", error)
  }

  // Admin password hash from environment
  // Note: Dollar signs in .env files need to be escaped as \$ to prevent variable expansion
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim()
  if (!adminPasswordHash) {
    console.warn("WARNING: ADMIN_PASSWORD_HASH not set. Admin features will be disabled.")
  }

  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  })

  // Set up Socket.IO
  const allowedOrigin = dev
    ? process.env.NEXT_PUBLIC_APP_URL || "*"
    : process.env.NEXT_PUBLIC_APP_URL

  if (!dev && !allowedOrigin) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is required in production for CORS security"
    )
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Additional security: only allow connections from allowed origin
    allowRequest: (req, callback) => {
      const origin = req.headers.origin
      if (allowedOrigin === "*" || !origin || origin === allowedOrigin) {
        callback(null, true)
      } else {
        callback("Origin not allowed", false)
      }
    },
  })

  // Rate limiting: track requests per socket
  const rateLimitMap = new Map()

  // Chat rate limiting: separate from magnet moves
  const chatRateLimitMap = new Map()

  // Track usernames: socketId -> username, and active usernames set
  const socketUsernames = new Map() // socketId -> username
  const activeUsernames = new Set() // Set of active usernames (case-insensitive)

  // Admin tracking
  const adminIPs = new Set() // Set of IP addresses with admin privileges (persists across reconnects)
  const activeMagnetMovements = new Map() // socketId -> { magnetIndex, username, startTime }
  const kickedSockets = new Map() // socketId -> { kickUntil: timestamp, message: string }
  const kickedIPs = new Map() // ipAddress -> { kickUntil: timestamp, message: string }
  const socketIPs = new Map() // socketId -> ipAddress (for tracking)
  const activeIPs = new Map() // ipAddress -> socketId (for preventing duplicate connections)

  // For showing conflicts in admin panel - This will only happen in development,
  // But it's an easy way to test the app with multiple tabs/windows at once.
  // We only allow one connection per IP address, so we spoof the IP via a query parameter in development.
  // That browser tab with the query parameter (or whichever connection comes later) will "lose" the username conflict.
  // This hack lets us keep track of "who's who" when testing across multiple tabs/windows in development.
  const attemptedUsernames = new Map() // socketId -> attemptedUsername

  // Flag to track if magnets have changed (for validation optimization)
  const magnetsChanged = { value: false }

  // Socket.IO connection handling
  io.on("connection", async (socket) => {
    const socketId = socket.id

    // Validate connection
    const validation = await validateConnection(socket, socketId, {
      bannedIPsSet,
      kickedIPs,
      activeIPs,
      io,
    })

    if (!validation.valid) {
      return
    }

    const clientIp = validation.clientIp

    // Track socket IP mapping and active IP
    socketIPs.set(socketId, clientIp)
    activeIPs.set(clientIp, socketId)

    // Initialize rate limiting for this socket
    rateLimitMap.set(socketId, { count: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW_MS })
    chatRateLimitMap.set(socketId, {
      count: 0,
      resetTime: Date.now() + CHAT_RATE_LIMIT_WINDOW_MS,
    })

    // Validate and send current state to new client
    const magnetsData = refrigerator.getMagnetsAsObjects()
    const validationResult = magnetsArraySchema.safeParse(magnetsData)

    if (!validationResult.success) {
      console.error("Invalid magnet data structure, cannot send welcome:", validationResult.error)
      socket.disconnect(true)
      return
    }

    socket.emit("welcome", validationResult.data)

    // Create context object for handlers
    const context = {
      socketId,
      clientIp,
      io,
      socketUsernames,
      activeUsernames,
      attemptedUsernames,
      rateLimitMap,
      chatRateLimitMap,
      refrigerator,
      activeMagnetMovements,
      adminIPs,
      adminPasswordHash,
      socketIPs,
      kickedSockets,
      kickedIPs,
      bannedIPsSet,
      activeIPs,
      magnetsChanged,
    }

    // Register all socket handlers
    handleSetUsername(socket, io, context)
    handleMagnetMove(socket, context)
    handleChatMessage(socket, io, context)
    handleAdminAuth(socket, context)
    handleAdminGetUsers(socket, context)
    handleAdminKickUser(socket, io, context)
    handleAdminBanUser(socket, io, context)
    handleAdminUnbanIP(socket, context)
    handleAdminGetKickedIPs(socket, context)
    handleAdminGetBannedIPs(socket, context)
    handleAdminResetFridge(socket, io, context)
    handleAdminGetMovements(socket, context)
    handleAdminGetMetrics(socket, context)
    handleDisconnect(socket, io, context)
  })

  // Set up server intervals
  setupServerIntervals(io, {
    refrigerator,
    kickedSockets,
    kickedIPs,
    activeMagnetMovements,
    adminIPs,
    socketIPs,
    magnetsChanged,
  })

  // Start HTTP server
  httpServer.listen(port, () => {
    console.info(`Ready on http://${hostname}:${port}`)
  })
})
