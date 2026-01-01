import mongoose from "mongoose"
const { Schema, model, models } = mongoose
import { MAX_NAME_LENGTH, MAX_EMAIL_LENGTH, MAX_CONTACT_MESSAGE_LENGTH } from "../constants.js"

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: false, maxLength: MAX_NAME_LENGTH },
    email: { type: String, required: false, maxLength: MAX_EMAIL_LENGTH },
    message: { type: String, required: true, maxLength: MAX_CONTACT_MESSAGE_LENGTH },
  },
  {
    timestamps: true,
  }
)

export const ContactMessage = models.ContactMessage || model("ContactMessage", contactMessageSchema)
