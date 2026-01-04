// Custom server handles Socket.IO (see server.js)

const nextConfig = {
  // Socket connections are properly cleaned up,
  // Effects that set up socket listeners are idempotent,
  // No memory leaks from improperly cleaned-up subscriptions, etc.
  reactStrictMode: true,
}

export default nextConfig
