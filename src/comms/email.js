import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not set - email functionality disabled")
}

const resend = new Resend(process.env.RESEND_API_KEY || "")

async function sendContactEmail(email, name, message) {
  if (!process.env.RESEND_API_KEY) {
    console.info("Email not sent - RESEND_API_KEY not configured")
    return
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error("RESEND_FROM_EMAIL environment variable is required")
  }

  if (!process.env.RESEND_TO_EMAIL) {
    throw new Error("RESEND_TO_EMAIL environment variable is required")
  }

  try {
    await resend.emails.send({
      to: process.env.RESEND_TO_EMAIL,
      from: process.env.RESEND_FROM_EMAIL,
      replyTo: email && email !== "Anonymous@refrigerator-magnets.com" ? email : undefined,
      subject: `Fridge-Magnets message from ${name}`,
      text: message,
    })
  } catch (error) {
    console.error("Error sending email:", error.message)
    if (error.response) {
      console.error("Resend response:", error.response.body)
    }
    throw error
  }
}

export default sendContactEmail
