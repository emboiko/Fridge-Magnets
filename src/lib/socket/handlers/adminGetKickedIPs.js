import { isAdmin, normalizeIP } from "../utils.js"

export function handleAdminGetKickedIPs(socket, context) {
  const { socketId, socketIPs, adminIPs, kickedIPs } = context

  socket.on("adminGetKickedIPs", () => {
    if (!isAdmin(socketId, socketIPs, adminIPs)) {
      socket.emit("error", { message: "Unauthorized" })
      return
    }

    const now = Date.now()
    const kickedIPsList = []

    for (const [ipAddress, kick] of kickedIPs.entries()) {
      if (now < kick.kickUntil) {
        const remainingSeconds = Math.ceil((kick.kickUntil - now) / 1000)
        kickedIPsList.push({
          ipAddress: normalizeIP(ipAddress),
          kickUntil: kick.kickUntil,
          remainingSeconds: remainingSeconds,
          message: kick.message || null,
        })
      }
    }

    kickedIPsList.sort((a, b) => a.kickUntil - b.kickUntil)

    socket.emit("adminKickedIPsList", { kickedIPs: kickedIPsList })
  })
}
