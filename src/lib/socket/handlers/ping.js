export function handlePing(socket, context) {
  const { socketPings } = context

  socket.on("ping", (data) => {
    const timestamp = data?.timestamp
    if (typeof timestamp === "number") {
      socket.emit("pong", { timestamp })
    }
  })

  socket.on("pingMeasurement", (data) => {
    const latency = data?.latency
    if (typeof latency === "number" && latency >= 0 && latency < 100000) {
      socketPings.set(socket.id, latency)
    }
  })
}
