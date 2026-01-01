export function isAdmin(socketId, socketIPs, adminIPs) {
  const ip = socketIPs.get(socketId)
  return ip ? adminIPs.has(ip) : false
}
