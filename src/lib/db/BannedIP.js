import mongoose from "mongoose"
const { Schema, model, models } = mongoose

const bannedIPSchema = new Schema(
  {
    ipAddress: { type: String, required: true, unique: true },
    bannedAt: { type: Date, default: Date.now },
    reason: { type: String, required: false },
  },
  {
    timestamps: true,
  }
)

export const BannedIP = models.BannedIP || model("BannedIP", bannedIPSchema)
