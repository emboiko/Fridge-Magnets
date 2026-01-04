import mongoose from "mongoose"
const { Schema, model, models } = mongoose

const magnetSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    radius: { type: Number, required: true },
    letter: { type: String, required: false },
    color: { type: String, required: false },
    sprite: { type: String, required: false },
    spriteCategory: { type: String, required: true },
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
