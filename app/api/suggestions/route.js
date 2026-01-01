import { NextResponse } from "next/server"
import sendSuggestionEmail from "@/src/comms/email.js"
import { verifyTurnstileToken } from "@/src/lib/turnstile/verify.js"
import { checkRateLimit } from "@/src/lib/rateLimit.js"
import { MAX_SUGGESTION_LENGTH, MAX_NAME_LENGTH, MAX_EMAIL_LENGTH } from "@/src/lib/constants"
import connectDB from "@/src/lib/db/mongoose.js"
import { Suggestion } from "@/src/lib/db/Suggestion.js"

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, suggestion, turnstileToken } = body

    const rateLimit = checkRateLimit(request)
    if (!rateLimit.allowed) {
      const resetSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${Math.ceil(resetSeconds / 60)} minute(s).`,
        },
        { status: 429 }
      )
    }

    if (name && name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or less.` },
        { status: 400 }
      )
    }

    if (email && email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: `Email must be ${MAX_EMAIL_LENGTH} characters or less.` },
        { status: 400 }
      )
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    if (!suggestion || !suggestion.trim()) {
      return NextResponse.json({ error: "Message field must not be empty." }, { status: 400 })
    }

    if (suggestion.length > MAX_SUGGESTION_LENGTH) {
      return NextResponse.json(
        { error: `Suggestion must be ${MAX_SUGGESTION_LENGTH} characters or less.` },
        { status: 400 }
      )
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 })
    }

    const verifyResult = await verifyTurnstileToken(turnstileToken)
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || "Verification failed. Please try again." },
        { status: 400 }
      )
    }

    const senderEmail = email || "Anonymous@refrigerator-magnets.com"
    const senderName = name || "Anonymous"
    const senderMessage = suggestion.trim()

    try {
      await connectDB()

      const suggestionDoc = new Suggestion({
        name: name || undefined,
        email: email || undefined,
        suggestion: senderMessage,
      })

      await suggestionDoc.save()
    } catch (error) {
      console.error("Error saving suggestion to database:", error)
    }

    try {
      await sendSuggestionEmail(senderEmail, senderName, senderMessage)
    } catch (error) {
      console.error("Error sending email:", error)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error processing suggestion:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
