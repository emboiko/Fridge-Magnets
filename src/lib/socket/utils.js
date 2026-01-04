// Normalizes an IP address by stripping IPv4-mapped IPv6 prefixes (::ffff:)
// This ensures consistent IP comparison across different environments (dev, Heroku, etc.)
// @param {string} ipAddress - The IP address to normalize
// @returns {string} - The normalized IP address
export function normalizeIP(ipAddress) {
  if (!ipAddress || typeof ipAddress !== "string") {
    return ipAddress
  }
  return ipAddress.replace(/^::ffff:/, "")
}

export function isAdmin(socketId, socketIPs, adminIPs) {
  const ip = socketIPs.get(socketId)
  return ip ? adminIPs.has(ip) : false
}
