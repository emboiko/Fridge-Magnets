import mongoose from "mongoose"
const { Schema, model, models } = mongoose
import { MAX_NAME_LENGTH, MAX_EMAIL_LENGTH, MAX_SUGGESTION_LENGTH } from "../constants.js"

const suggestionSchema = new Schema(
  {
    name: { type: String, required: false, maxLength: MAX_NAME_LENGTH },
    email: { type: String, required: false, maxLength: MAX_EMAIL_LENGTH },
    suggestion: { type: String, required: true, maxLength: MAX_SUGGESTION_LENGTH },
  },
  {
    timestamps: true,
  }
)

export const Suggestion = models.Suggestion || model("Suggestion", suggestionSchema)
