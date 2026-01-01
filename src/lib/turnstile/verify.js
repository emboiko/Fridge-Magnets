export async function verifyTurnstileToken(token) {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY ||
    (process.env.NODE_ENV === "development" ? "1x0000000000000000000000000000000AA" : null)

  if (!secretKey) {
    console.error("Turnstile secret key not configured")
    return {
      success: false,
      error: "Server configuration error. Please try again later.",
    }
  }

  try {
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.success) {
      return {
        success: false,
        error: "Verification failed. Please try again.",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying Turnstile token:", error)
    return {
      success: false,
      error: "Verification service error. Please try again.",
    }
  }
}
