import mongoose from "mongoose"

function getMongoURI() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL

  if (!uri) {
    throw new Error("Please define MONGODB_URI or MONGODB_URL in your .env.local file")
  }

  return uri
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 *
 * Connect to MongoDB:
 * Uses connection caching to prevent multiple connections
 */

const cached = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const uri = getMongoURI()
    const opts = {
      bufferCommands: false,
    }

    cached.promise = (async () => {
      try {
        const connection = await mongoose.connect(uri, opts)
        console.info("Database connected")
        return connection
      } catch (error) {
        cached.promise = null
        throw error
      }
    })()
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}

export default connectDB
