import mongoose from "mongoose"
const { Schema, model, models } = mongoose

const magnetSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    radius: { type: Number, required: true },
    letter: { type: String, required: false }, // Optional - magnets can be sprite-only
    color: { type: String, required: false }, // Optional - magnets can be sprite-only
    sprite: { type: String, required: false }, // Optional - magnets can be letter-only
    spriteCategory: { type: String, required: true }, // Required - "regular" or "enhanced"
  },
  {
    _id: false,
  }
)

const fridgeSchema = new Schema(
  {
    magnets: [magnetSchema],
  },
  {
    timestamps: true,
  }
)

export const Fridge = models.Fridge || model("Fridge", fridgeSchema)
