import sgMail from "@sendgrid/mail"

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set - email functionality disabled")
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "")

async function sendSuggestionEmail(email, name, message) {
  if (!process.env.SENDGRID_API_KEY) {
    console.info("Email not sent - SENDGRID_API_KEY not configured")
    return
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error("SENDGRID_FROM_EMAIL environment variable is required")
  }

  if (!process.env.SENDGRID_TO_EMAIL) {
    throw new Error("SENDGRID_TO_EMAIL environment variable is required")
  }

  try {
    await sgMail.send({
      to: process.env.SENDGRID_TO_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      replyTo: email && email !== "Anonymous@refrigerator-magnets.com" ? email : undefined,
      subject: `Fridge-Magnets message from ${name}`,
      text: message,
    })
  } catch (error) {
    console.error("Error sending email:", error.message)
    if (error.response) {
      console.error("SendGrid response:", error.response.body)
    }
    throw error
  }
}

export default sendSuggestionEmail
