import {
  EMOJIS,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_EMOJI_MULTIPLIER,
  FONT_SIZE_TEXT_MULTIPLIER,
  FONT_SIZE_HEIGHT_ESTIMATE_MULTIPLIER,
  CANVAS_PADDING,
} from "@/src/lib/constants.js"

export function calculateFontSize(ctx, text, maxRadius) {
  let minFontSize = FONT_SIZE_MIN
  let maxFontSize = FONT_SIZE_MAX
  let fontSize = maxFontSize

  const sizeMultiplier = isEmoji(text) ? FONT_SIZE_EMOJI_MULTIPLIER : FONT_SIZE_TEXT_MULTIPLIER
  const targetSize = maxRadius * sizeMultiplier

  // Binary search: keep guessing the middle between too big and too small until we find the right size
  // Like playing "hot or cold" - if too big, try smaller; if too small, try bigger; keep narrowing down
  while (maxFontSize - minFontSize > 1) {
    // Try the middle size between our smallest and largest guesses
    fontSize = (minFontSize + maxFontSize) / 2
    ctx.font = `${fontSize}px 'Luckiest Guy', cursive`
    const metrics = ctx.measureText(text)

    const textWidth = metrics.width
    const textHeight =
      (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0)

    const estimatedHeight =
      textHeight > 0 ? textHeight : fontSize * FONT_SIZE_HEIGHT_ESTIMATE_MULTIPLIER
    const maxTextDimension = Math.max(textWidth, estimatedHeight)
    const fits = maxTextDimension <= targetSize

    // Note: Some letters (like 'W') may appear smaller due to font characteristics.
    // The 'Luckiest Guy' font has W with wider proportions, so when constrained
    // by width, the visual height may appear smaller relative to other letters.
    // This is a font design artifact, not a calculation error.

    if (fits) {
      minFontSize = fontSize
    } else {
      maxFontSize = fontSize
    }
  }

  return Math.floor(minFontSize)
}

export function drawMagnet(ctx, magnet, imageCache, isDarkMode, showDebug = false) {
  if (magnet.letter) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const fontSize = calculateFontSize(ctx, magnet.letter, magnet.radius)
    ctx.font = `${fontSize}px 'Luckiest Guy', cursive`

    ctx.fillStyle = magnet.color
    ctx.strokeStyle = isDarkMode ? "#cccccc" : "#000000"
    ctx.lineWidth = isDarkMode ? 1.0 : 1.5
    ctx.fillText(magnet.letter, magnet.x, magnet.y)
    ctx.strokeText(magnet.letter, magnet.x, magnet.y)
  }

  if (magnet.sprite) {
    const img = imageCache.get(magnet.sprite)
    if (img && img.complete && img.naturalWidth > 0) {
      // Find the biggest side of the image (width or height)
      const maxDimension = Math.max(img.width, img.height)
      // Calculate how much to shrink or grow the image to fit in the magnet circle
      // If magnet is 60 pixels wide, and image is 100 pixels, we need to make it 60% smaller
      const scale = (magnet.radius * 2) / maxDimension
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale

      // Draw image centered on the magnet (subtract half the image size from the center point)
      ctx.drawImage(
        img,
        magnet.x - scaledWidth / 2,
        magnet.y - scaledHeight / 2,
        scaledWidth,
        scaledHeight
      )
    }
  }

  if (showDebug) {
    // Circles are way slower than rects
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 1
    ctx.strokeRect(
      magnet.x - magnet.radius,
      magnet.y - magnet.radius,
      magnet.radius * 2,
      magnet.radius * 2
    )
  }
}

export function isMagnetVisible(magnet, viewport) {
  const padding = magnet.radius + CANVAS_PADDING
  return (
    magnet.x + padding >= viewport.left &&
    magnet.x - padding <= viewport.right &&
    magnet.y + padding >= viewport.top &&
    magnet.y - padding <= viewport.bottom
  )
}

export function isEmoji(text) {
  return EMOJIS.includes(text)
}
