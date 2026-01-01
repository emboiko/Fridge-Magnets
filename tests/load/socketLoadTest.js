import { io } from "socket.io-client"
import { performance } from "perf_hooks"

import dotenv from "dotenv"
import { resolve } from "path"
dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true })

const SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3000"
const CONCURRENT_USERS = parseInt(process.env.TEST_CONCURRENT_USERS || "50", 10)
const TEST_DURATION_MS = parseInt(process.env.TEST_DURATION_MS || "30000", 10)
const MAGNET_COUNT = parseInt(process.env.TEST_MAGNET_COUNT || "0", 10)

// Activity configuration
// TEST_ACTIVITY_MODE: "full" (maximum hammering) or "realistic" (random activity)
const ACTIVITY_MODE = process.env.TEST_ACTIVITY_MODE || "full"
// TEST_MOVE_INTERVAL_MS: Milliseconds between moves (default 17ms = ~60fps, realistic might be 50-200ms)
const MOVE_INTERVAL_MS = parseInt(
  process.env.TEST_MOVE_INTERVAL_MS || (ACTIVITY_MODE === "realistic" ? "500" : "17"),
  10
)
// TEST_DRAG_PROBABILITY: Probability (0-1) that a user is actively dragging (realistic mode only)
const DRAG_PROBABILITY = parseFloat(
  process.env.TEST_DRAG_PROBABILITY || (ACTIVITY_MODE === "realistic" ? "0.3" : "1.0")
)
// TEST_DRAG_SESSION_MIN_MS: Minimum duration of a drag session in realistic mode
const DRAG_SESSION_MIN_MS = parseInt(process.env.TEST_DRAG_SESSION_MIN_MS || "2000", 10)
// TEST_DRAG_SESSION_MAX_MS: Maximum duration of a drag session in realistic mode
const DRAG_SESSION_MAX_MS = parseInt(process.env.TEST_DRAG_SESSION_MAX_MS || "8000", 10)

// Network simulation
// TEST_NETWORK_PROFILE: "none", "slow-3g", "fast-3g", "4g", "custom"
const NETWORK_PROFILE = process.env.TEST_NETWORK_PROFILE || "none"
// TEST_NETWORK_LATENCY_MS: Custom latency in milliseconds (for custom profile)
const NETWORK_LATENCY_MS = parseInt(process.env.TEST_NETWORK_LATENCY_MS || "0", 10)
// TEST_NETWORK_JITTER_MS: Random jitter added to latency (for custom profile)
const NETWORK_JITTER_MS = parseInt(process.env.TEST_NETWORK_JITTER_MS || "0", 10)

// Network profiles (latency in ms)
const NETWORK_PROFILES = {
  none: { latency: 0, jitter: 0 },
  "slow-3g": { latency: 400, jitter: 400 }, // 400-800ms
  "fast-3g": { latency: 150, jitter: 100 }, // 150-250ms
  "4g": { latency: 20, jitter: 10 }, // 20-30ms
  custom: { latency: NETWORK_LATENCY_MS, jitter: NETWORK_JITTER_MS },
}

const networkConfig = NETWORK_PROFILES[NETWORK_PROFILE] || NETWORK_PROFILES.none

// Latency measurement
// TEST_MEASURE_LATENCY: Enable latency measurement (one user moves, others measure)
const MEASURE_LATENCY = process.env.TEST_MEASURE_LATENCY === "true"

/**
 * Virtual user that simulates a real client
 */
class VirtualUser {
  constructor(userId) {
    this.userId = userId
    this.socket = null
    this.magnetIndex = null
    this.isDragging = false
    this.dragInterval = null
    this.dragSessionTimeout = null
    this.magnetCount = null
    this.receivedWelcome = false
    this.lastError = null
    this.welcomePromise = null
    this.welcomeResolver = null
    this.stats = {
      movesSent: 0,
      updatesReceived: 0,
      errors: 0,
      rateLimitHits: 0,
      connectionTime: null,
      disconnectTime: null,
      latencyMeasurements: [], // Array of { sentTime, receivedTime, latency }
    }
    this.lastUpdateTime = null
    this.pendingMoves = new Map() // Track sent moves for latency measurement: magnetIndex -> sentTime
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const connectStart = performance.now()
      // Use unique test IP for each user to avoid duplicate connection rejection
      // Format: 127.0.0.{userId % 254 + 1} to stay in valid IP range
      const testIP = `127.0.0.${(this.userId % 254) + 1}`

      this.socket = io(SERVER_URL, {
        transports: ["websocket"],
        reconnection: false,
        timeout: 15000, // Increased timeout for high load scenarios
        auth: {
          testIP: testIP,
        },
      })

      // Set up listeners BEFORE connect to catch welcome event
      this.setupListeners()

      this.socket.on("connect", () => {
        this.stats.connectionTime = performance.now() - connectStart
        this.socket.emit("setUsername", { username: `TestUser_${this.userId}` })
        resolve()
      })

      this.socket.on("connect_error", (error) => {
        reject(error)
      })

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error("Connection timeout"))
        }
      }, 15000)
    })
  }

  setupListeners() {
    // Use a promise to track welcome event
    this.welcomePromise = new Promise((resolve) => {
      this.welcomeResolver = resolve
    })

    this.socket.on("welcome", (magnets) => {
      // Store magnet count from welcome event
      if (magnets && Array.isArray(magnets)) {
        this.magnetCount = magnets.length
        this.receivedWelcome = true
      }
      if (this.welcomeResolver) {
        this.welcomeResolver()
      }
    })

    this.socket.on("update", (magnets) => {
      this.stats.updatesReceived++
      this.lastUpdateTime = Date.now()

      // Measure latency if enabled
      if (MEASURE_LATENCY && magnets && Array.isArray(magnets)) {
        const now = performance.now()
        magnets.forEach((magnet, index) => {
          if (this.pendingMoves.has(index)) {
            const sentTime = this.pendingMoves.get(index)
            const latency = now - sentTime
            this.stats.latencyMeasurements.push({
              sentTime,
              receivedTime: now,
              latency,
              magnetIndex: index,
            })
            this.pendingMoves.delete(index)
          }
        })
      }
    })

    this.socket.on("error", (data) => {
      this.stats.errors++
      this.lastError = {
        message: data.message || "Unknown error",
        code: data.code || null,
        timestamp: Date.now(),
      }
      if (data.message?.includes("Rate limit")) {
        this.stats.rateLimitHits++
      }
    })

    this.socket.on("usernameError", (data) => {
      this.stats.errors++
      this.lastError = {
        message: data.message || "Username error",
        code: "USERNAME_ERROR",
        timestamp: Date.now(),
      }
    })

    this.socket.on("disconnect", () => {
      this.stats.disconnectTime = Date.now()
    })
  }

  startDragging(magnetIndex) {
    if (this.isDragging) {
      return
    }

    // Validate magnet index
    if (magnetIndex < 0 || (this.magnetCount && magnetIndex >= this.magnetCount)) {
      console.warn(
        `User ${this.userId}: Invalid magnet index ${magnetIndex} (max: ${this.magnetCount || "unknown"})`
      )
      return
    }

    this.magnetIndex = magnetIndex
    this.isDragging = true

    // Simulate dragging at configured interval
    this.dragInterval = setInterval(() => {
      if (!this.isDragging || !this.socket?.connected) {
        this.stopDragging()
        return
      }

      // Don't send moves if we haven't received welcome yet
      if (!this.receivedWelcome) {
        return
      }

      // Random position on canvas
      const x = Math.random() * 6000
      const y = Math.random() * 6000

      // Apply network latency simulation
      const emitMove = () => {
        const sentTime = performance.now()

        // Track for latency measurement
        if (MEASURE_LATENCY) {
          this.pendingMoves.set(this.magnetIndex, sentTime)
        }

        this.socket.emit("magnetMove", {
          x,
          y,
          magnetIndex: this.magnetIndex,
        })
        this.stats.movesSent++
      }

      if (networkConfig.latency > 0 || networkConfig.jitter > 0) {
        // Calculate delay with jitter
        const baseDelay = networkConfig.latency
        const jitter = networkConfig.jitter > 0 ? Math.random() * networkConfig.jitter : 0
        const totalDelay = baseDelay + jitter

        setTimeout(emitMove, totalDelay)
      } else {
        emitMove()
      }
    }, MOVE_INTERVAL_MS)

    // In realistic mode, schedule a random drag session end
    if (ACTIVITY_MODE === "realistic") {
      const sessionDuration =
        DRAG_SESSION_MIN_MS + Math.random() * (DRAG_SESSION_MAX_MS - DRAG_SESSION_MIN_MS)
      this.dragSessionTimeout = setTimeout(() => {
        this.stopDragging()
        // After a pause, potentially start dragging again
        this.scheduleNextDrag()
      }, sessionDuration)
    }
  }

  scheduleNextDrag() {
    if (ACTIVITY_MODE !== "realistic" || !this.socket?.connected) {
      return
    }

    // Random pause before next drag session (1-5 seconds)
    const pauseDuration = 1000 + Math.random() * 4000
    this.dragSessionTimeout = setTimeout(() => {
      if (!this.socket?.connected || !this.receivedWelcome) {
        return
      }

      // Randomly decide if this user should start dragging again
      if (Math.random() < DRAG_PROBABILITY) {
        const availableMagnetCount = this.magnetCount || 100
        if (availableMagnetCount > 0) {
          const magnetIndex = Math.floor(Math.random() * availableMagnetCount)
          this.startDragging(magnetIndex)
        }
      } else {
        // Schedule another check later
        this.scheduleNextDrag()
      }
    }, pauseDuration)
  }

  stopDragging() {
    this.isDragging = false
    if (this.dragInterval) {
      clearInterval(this.dragInterval)
      this.dragInterval = null
    }
    if (this.dragSessionTimeout) {
      clearTimeout(this.dragSessionTimeout)
      this.dragSessionTimeout = null
    }
  }

  disconnect() {
    this.stopDragging()
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  getStats() {
    return {
      ...this.stats,
      userId: this.userId,
      connected: this.socket?.connected || false,
      receivedWelcome: this.receivedWelcome,
      magnetCount: this.magnetCount,
      lastError: this.lastError,
    }
  }
}

/**
 * Run the load test
 */
async function runLoadTest() {
  console.info("\n" + "=".repeat(60))
  console.info("Socket.IO Load Test")
  console.info("=".repeat(60))
  console.info(`Server URL: ${SERVER_URL}`)
  console.info(`Concurrent Users: ${CONCURRENT_USERS}`)
  console.info(`Network Profile: ${NETWORK_PROFILE}`)
  console.info(`Test Duration: ${TEST_DURATION_MS}ms (${TEST_DURATION_MS / 1000}s)`)
  if (MAGNET_COUNT > 0) {
    console.info(`Magnet Count: ${MAGNET_COUNT} (manual)`)
  } else {
    console.info(`Magnet Count: Auto-detect from server`)
  }
  console.info(`Activity Mode: ${ACTIVITY_MODE}`)
  if (ACTIVITY_MODE === "realistic") {
    console.info(`  Move Interval: ${MOVE_INTERVAL_MS}ms`)
    console.info(`  Drag Probability: ${(DRAG_PROBABILITY * 100).toFixed(0)}%`)
    console.info(`  Drag Session: ${DRAG_SESSION_MIN_MS}-${DRAG_SESSION_MAX_MS}ms`)
  } else {
    console.info(
      `  Move Interval: ${MOVE_INTERVAL_MS}ms (~${Math.round(1000 / MOVE_INTERVAL_MS)} moves/sec per user)`
    )
  }
  console.info("=".repeat(60) + "\n")

  const users = []
  let connectedCount = 0
  let failedConnections = 0
  let detectedMagnetCount = MAGNET_COUNT

  // Connect first user to detect magnet count
  if (MAGNET_COUNT === 0) {
    console.info("Detecting magnet count from server...")
    const probeUser = new VirtualUser(-1)
    try {
      await probeUser.connect()
      // Wait for welcome event
      try {
        await Promise.race([
          probeUser.welcomePromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
        ])
      } catch {
        console.warn("Probe user did not receive welcome event")
      }
      if (probeUser.magnetCount) {
        detectedMagnetCount = probeUser.magnetCount
        console.info(`Detected ${detectedMagnetCount} magnets`)
      }
      probeUser.disconnect()
    } catch {
      console.warn("Failed to detect magnet count, using default estimate")
      detectedMagnetCount = 100
    }
  }

  // Connect all users in parallel for better performance
  // For small numbers of users (< 50), we can connect them all at once
  // For larger numbers, we might want to add batching back
  console.info("Connecting users...")
  const connectionPromises = []

  // Start all connections immediately
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const user = new VirtualUser(i)
    const connectPromise = (async () => {
      try {
        await user.connect()
        users.push(user)

        // Wait for welcome event with timeout (non-blocking for other users)
        try {
          await Promise.race([
            user.welcomePromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Welcome timeout")), 2000)
            ),
          ])
        } catch {
          // Welcome timeout is not critical - user can still participate
        }

        connectedCount++
        process.stdout.write(`\rConnected: ${connectedCount}/${CONCURRENT_USERS}`)
        return { success: true, user }
      } catch (error) {
        failedConnections++
        process.stdout.write(
          `\rConnected: ${connectedCount}/${CONCURRENT_USERS} (Failed: ${failedConnections})`
        )
        return { success: false, error: error.message, userId: i }
      }
    })()

    connectionPromises.push(connectPromise)
  }

  // Wait for all connections to complete
  await Promise.all(connectionPromises)

  console.info(`\n\nConnected ${connectedCount}/${CONCURRENT_USERS} users`)
  if (failedConnections > 0) {
    console.info(`Failed connections: ${failedConnections}`)
  }

  // Start all user activity now that connections are complete
  // This ensures the test duration accurately reflects configured time
  console.info("Starting user activity...")
  const availableMagnetCount = detectedMagnetCount || 100
  users.forEach((user) => {
    const userMagnetCount = user.magnetCount || availableMagnetCount
    if (userMagnetCount > 0) {
      if (ACTIVITY_MODE === "realistic") {
        // In realistic mode, only some users start dragging immediately
        if (Math.random() < DRAG_PROBABILITY) {
          const magnetIndex = Math.floor(Math.random() * userMagnetCount)
          user.startDragging(magnetIndex)
        } else {
          // Schedule a delayed start
          user.scheduleNextDrag()
        }
      } else {
        // Full hammer mode - everyone drags immediately
        const magnetIndex = Math.floor(Math.random() * userMagnetCount)
        user.startDragging(magnetIndex)
      }
    }
  })

  // Small delay to let activity initialize
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Run test for specified duration
  // Note: This is the active test duration, not including connection time
  console.info(`\nRunning test for ${TEST_DURATION_MS / 1000} seconds...`)
  const testStartTime = Date.now()
  const totalStartTime = Date.now() // Track total runtime

  // Periodic status updates
  const statusInterval = setInterval(() => {
    const elapsed = (Date.now() - testStartTime) / 1000
    const totalMoves = users.reduce((sum, u) => sum + u.stats.movesSent, 0)
    const totalUpdates = users.reduce((sum, u) => sum + u.stats.updatesReceived, 0)
    const totalErrors = users.reduce((sum, u) => sum + u.stats.errors, 0)

    process.stdout.write(
      `\r[${elapsed.toFixed(1)}s] Moves: ${totalMoves} | Updates: ${totalUpdates} | Errors: ${totalErrors}`
    )
  }, 1000)

  await new Promise((resolve) => setTimeout(resolve, TEST_DURATION_MS))
  clearInterval(statusInterval)

  // Stop all users
  console.info("\n\nStopping all users...")
  users.forEach((user) => user.stopDragging())

  // Give time for final messages to process
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Disconnect all
  users.forEach((user) => user.disconnect())
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Collect and analyze stats
  const stats = users.map((user) => user.getStats())
  const totalMoves = stats.reduce((sum, s) => sum + s.movesSent, 0)
  const totalUpdates = stats.reduce((sum, s) => sum + s.updatesReceived, 0)
  const totalErrors = stats.reduce((sum, s) => sum + s.errors, 0)
  const totalRateLimitHits = stats.reduce((sum, s) => sum + s.rateLimitHits, 0)
  const usersWithWelcome = stats.filter((s) => s.receivedWelcome).length
  const usersWithoutWelcome = connectedCount - usersWithWelcome

  // Collect unique error messages
  const errorMessages = new Map()
  stats.forEach((s) => {
    if (s.lastError) {
      const key = s.lastError.message || "Unknown error"
      errorMessages.set(key, (errorMessages.get(key) || 0) + 1)
    }
  })

  // Calculate latency statistics
  const allLatencyMeasurements = []
  stats.forEach((s) => {
    if (s.latencyMeasurements && s.latencyMeasurements.length > 0) {
      allLatencyMeasurements.push(...s.latencyMeasurements)
    }
  })

  let latencyStats = null
  if (allLatencyMeasurements.length > 0) {
    const latencies = allLatencyMeasurements.map((m) => m.latency)
    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)]
    const p75 = latencies[Math.floor(latencies.length * 0.75)]
    const p90 = latencies[Math.floor(latencies.length * 0.9)]
    const p95 = latencies[Math.floor(latencies.length * 0.95)]
    const p99 = latencies[Math.floor(latencies.length * 0.99)]
    const min = latencies[0]
    const max = latencies[latencies.length - 1]
    const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length

    // Calculate histogram buckets for visualization
    const bucketSize = 50 // 50ms buckets
    const maxBucket = Math.ceil(max / bucketSize)
    const histogram = new Array(maxBucket + 1).fill(0)
    latencies.forEach((latency) => {
      const bucket = Math.floor(latency / bucketSize)
      histogram[bucket] = (histogram[bucket] || 0) + 1
    })

    latencyStats = {
      count: allLatencyMeasurements.length,
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      p50: p50.toFixed(2),
      p75: p75.toFixed(2),
      p90: p90.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      histogram,
      bucketSize,
    }
  }

  const testDurationSeconds = (Date.now() - testStartTime) / 1000
  const movesPerSecond = totalMoves / testDurationSeconds
  const updatesPerSecond = totalUpdates / testDurationSeconds

  const avgConnectionTime =
    stats.filter((s) => s.connectionTime !== null).reduce((sum, s) => sum + s.connectionTime, 0) /
    connectedCount

  const totalRuntimeSeconds = (Date.now() - totalStartTime) / 1000

  // Print results
  console.info("\n" + "=".repeat(60))
  console.info("Load Test Results")
  console.info("=".repeat(60))
  console.info(`Active Test Duration: ${testDurationSeconds.toFixed(2)}s`)
  console.info(`Total Runtime: ${totalRuntimeSeconds.toFixed(2)}s (includes connection phase)`)
  console.info(`Connected Users: ${connectedCount}/${CONCURRENT_USERS}`)
  console.info(`Failed Connections: ${failedConnections}`)
  console.info(`\nPerformance Metrics:`)
  console.info(`  Total Moves Sent: ${totalMoves.toLocaleString()}`)
  console.info(`  Total Updates Received: ${totalUpdates.toLocaleString()}`)
  console.info(`  Moves per Second: ${movesPerSecond.toFixed(2)}`)
  console.info(`  Updates per Second: ${updatesPerSecond.toFixed(2)}`)
  console.info(`  Average Moves per User: ${(totalMoves / connectedCount).toFixed(2)}`)
  console.info(`  Average Updates per User: ${(totalUpdates / connectedCount).toFixed(2)}`)
  console.info(`\nError Metrics:`)
  console.info(`  Total Errors: ${totalErrors}`)
  console.info(`  Rate Limit Hits: ${totalRateLimitHits}`)
  if (totalMoves > 0) {
    console.info(`  Error Rate: ${((totalErrors / totalMoves) * 100).toFixed(2)}%`)
  } else {
    console.info(`  Error Rate: N/A (no moves sent)`)
  }

  if (errorMessages.size > 0) {
    console.info(`\n  Error Breakdown:`)
    errorMessages.forEach((count, message) => {
      console.info(`    ${message}: ${count}`)
    })
  }

  console.info(`\nConnection Metrics:`)
  console.info(`  Average Connection Time: ${avgConnectionTime.toFixed(2)}ms`)
  console.info(`  Users Received Welcome: ${usersWithWelcome}/${connectedCount}`)
  if (usersWithoutWelcome > 0) {
    console.info(`  ⚠️  ${usersWithoutWelcome} users did not receive welcome event`)
  }

  if (latencyStats) {
    console.info(`\nLatency Metrics (Move → Update):`)
    console.info(`  Measurements: ${latencyStats.count}`)
    console.info(`  Min: ${latencyStats.min}ms`)
    console.info(`  Max: ${latencyStats.max}ms`)
    console.info(`  Avg: ${latencyStats.avg}ms`)
    console.info(`  P50 (Median): ${latencyStats.p50}ms`)
    console.info(`  P75: ${latencyStats.p75}ms`)
    console.info(`  P90: ${latencyStats.p90}ms`)
    console.info(`  P95: ${latencyStats.p95}ms`)
    console.info(`  P99: ${latencyStats.p99}ms`)

    // Show histogram
    const maxCount = Math.max(...latencyStats.histogram)
    const maxBarLength = 40
    console.info(`\n  Latency Distribution (${latencyStats.bucketSize}ms buckets):`)
    latencyStats.histogram.forEach((count, bucket) => {
      if (count > 0) {
        const range = `${bucket * latencyStats.bucketSize}-${(bucket + 1) * latencyStats.bucketSize}ms`
        const barLength = Math.round((count / maxCount) * maxBarLength)
        const bar = "█".repeat(barLength)
        const percentage = ((count / latencyStats.count) * 100).toFixed(1)
        console.info(`    ${range.padEnd(15)} │${bar} ${count} (${percentage}%)`)
      }
    })

    // Analysis
    const p50Num = parseFloat(latencyStats.p50)
    const p95Num = parseFloat(latencyStats.p95)
    const p99Num = parseFloat(latencyStats.p99)
    const expectedMin = 16.67 // One broadcast cycle at 60fps

    console.info(`\n  Analysis:`)
    if (p50Num > expectedMin * 2) {
      console.info(
        `    ⚠️  P50 (${latencyStats.p50}ms) is ${(p50Num / expectedMin).toFixed(1)}x higher than expected minimum (~${expectedMin}ms)`
      )
      console.info(`       Server broadcast intervals may be drifting under load`)
    }
    if (p95Num > p50Num * 2) {
      console.info(
        `    ⚠️  P95 (${latencyStats.p95}ms) is ${(p95Num / p50Num).toFixed(1)}x higher than P50`
      )
      console.info(`       Occasional event loop blocking or validation overhead`)
    }
    if (p99Num > p95Num * 1.5) {
      console.info(`    ⚠️  P99 (${latencyStats.p99}ms) shows significant tail latency`)
      console.info(`       Consider optimizing broadcast logic`)
    }
  } else if (MEASURE_LATENCY) {
    console.info(`\n⚠️  No latency measurements collected`)
  }

  console.info("=".repeat(60) + "\n")

  // Check for potential issues
  if (totalRateLimitHits > 0) {
    console.info("⚠️  Rate limiting detected - consider adjusting RATE_LIMIT_MAX_MOVES")
  }

  if (failedConnections > CONCURRENT_USERS * 0.1) {
    console.info("⚠️  High connection failure rate - server may be overloaded")
  }

  if (totalErrors > totalMoves * 0.05) {
    console.info("⚠️  High error rate - check server logs")
  }

  return {
    connectedCount,
    failedConnections,
    totalMoves,
    totalUpdates,
    movesPerSecond,
    updatesPerSecond,
    totalErrors,
    totalRateLimitHits,
    avgConnectionTime,
  }
}

// Run the test
runLoadTest()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("\nTest failed:", error)
    process.exit(1)
  })
