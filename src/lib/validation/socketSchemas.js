import { z } from "zod"
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_MAGNET_RADIUS,
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_ADMIN_KICK_MESSAGE_LENGTH,
  MAX_ADMIN_BAN_REASON_LENGTH,
  MIN_ADMIN_KICK_TIMEOUT_SECONDS,
  MAX_ADMIN_KICK_TIMEOUT_SECONDS,
} from "../constants.js"

export const magnetSchema = z.object({
  x: z.number().min(0).max(CANVAS_WIDTH), // Canvas width
  y: z.number().min(0).max(CANVAS_HEIGHT), // Canvas height
  radius: z.number().positive().max(MAX_MAGNET_RADIUS), // Reasonable radius limit
  letter: z.string().optional(), // Letter/Glyph - only for text magnets
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/i), // Hex color with 6 digits - Only for text magnets
  sprite: z.string().optional(), // Sprite filename - Only for image magnets
  spriteCategory: z.enum(["regular", "enhanced"]), // Sprite category - "regular" or "enhanced"
})

// Schema for magnetMove event (client -> server)
export const magnetMoveSchema = z.object({
  x: z.number().min(0).max(CANVAS_WIDTH), // Canvas width
  y: z.number().min(0).max(CANVAS_HEIGHT), // Canvas height
  magnetIndex: z.number().int().min(0), // Magnet index (must be integer, non-negative)
})

// Schema for magnet arrays (used for welcome and update events)
export const magnetsArraySchema = z.array(magnetSchema)

// Schema for chatMessage event (client -> server)
// Note: username is validated server-side from socketUsernames map
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH).trim(), // Message: 1-MAX_CHAT_MESSAGE_LENGTH characters, trimmed
})

// Admin schemas
export const adminAuthSchema = z.object({
  password: z.string().min(1),
})

export const adminKickUserSchema = z.object({
  socketId: z.string().min(1),
  timeoutSeconds: z
    .number()
    .int()
    .min(MIN_ADMIN_KICK_TIMEOUT_SECONDS)
    .max(MAX_ADMIN_KICK_TIMEOUT_SECONDS), // 1 second to 24 hours
  message: z.string().max(MAX_ADMIN_KICK_MESSAGE_LENGTH).optional(),
})

export const adminBanUserSchema = z.object({
  socketId: z.string().min(1),
  reason: z.string().max(MAX_ADMIN_BAN_REASON_LENGTH).optional(),
})

export const adminUnbanIPSchema = z.object({
  ipAddress: z.string().min(1),
})
