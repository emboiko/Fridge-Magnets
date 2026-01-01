import mongoose from "mongoose"
const { Schema, model, models } = mongoose

const kickLogSchema = new Schema(
  {
    ipAddress: { type: String, required: false },
    socketId: { type: String, required: false },
    username: { type: String, required: false },
    kickedAt: { type: Date, default: Date.now },
    kickUntil: { type: Date, required: true },
    timeoutSeconds: { type: Number, required: true },
    message: { type: String, required: false },
    kickedBy: { type: String, required: false },
  },
  {
    timestamps: true,
  }
)

export const KickLog = models.KickLog || model("KickLog", kickLogSchema)
