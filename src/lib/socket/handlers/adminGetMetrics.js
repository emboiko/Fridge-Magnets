import { isAdmin } from "../utils.js"
import os from "os"

// Calculates CPU usage by sampling CPU times over an interval
function cpuAverage() {
  const cpus = os.cpus()
  let idle = 0
  let total = 0

  cpus.forEach((core) => {
    for (const type in core.times) {
      total += core.times[type]
    }
    idle += core.times.idle
  })

  return { idle, total }
}

function getCPUUsage(intervalMs = 100) {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage()

    setTimeout(() => {
      const endMeasure = cpuAverage()

      const idleDifference = endMeasure.idle - startMeasure.idle
      const totalDifference = endMeasure.total - startMeasure.total

      const percentageCPU = 100 - Math.floor((100 * idleDifference) / totalDifference)

      resolve(percentageCPU)
    }, intervalMs)
  })
}

// This is a bit of a toy feature at the moment. Prefer heroku metrics for more accurate data.
export function handleAdminGetMetrics(socket, context) {
  const { socketId, socketIPs, adminIPs } = context

  socket.on("adminGetMetrics", async () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    try {
      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      const usedMemory = totalMemory - freeMemory
      const memoryUsagePercent = (usedMemory / totalMemory) * 100

      const uptime = os.uptime()

      const cpus = os.cpus()
      const cpuCount = cpus.length
      const cpuModel = cpus[0]?.model || "Unknown"

      const cpuUsagePercent = await getCPUUsage(100)

      const metrics = {
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usagePercent: memoryUsagePercent,
        },
        cpu: {
          count: cpuCount,
          model: cpuModel,
          usagePercent: cpuUsagePercent,
        },
        uptime: uptime,
        timestamp: Date.now(),
      }

      socket.emit("adminMetrics", metrics)
    } catch (error) {
      console.error("Error fetching server metrics:", error)
      socket.emit("error", { message: "Failed to fetch server metrics" })
    }
  })
}
