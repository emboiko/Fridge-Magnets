import { useEffect, useRef } from "react"
import { GifReader } from "omggif"
import { isAnimatedImage } from "../utils.js"

// Hook to manage image loading and caching
// For animated GIFs, decodes frames using omggif
export function useImageLoading(magnets) {
  const imageCacheRef = useRef(new Map())
  const animationStateRef = useRef(new Map())

  useEffect(() => {
    const imageCache = imageCacheRef.current
    const animationState = animationStateRef.current

    const loadAnimatedGif = async (cacheKey, imageUrl) => {
      try {
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const reader = new GifReader(uint8Array)

        const width = reader.width
        const height = reader.height
        const numFrames = reader.numFrames()

        const frames = []
        const frameDelays = []

        for (let i = 0; i < numFrames; i++) {
          const frameInfo = reader.frameInfo(i)
          const frameData = new Uint8ClampedArray(width * height * 4)
          reader.decodeAndBlitFrameRGBA(i, frameData)

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          const imageData = ctx.createImageData(width, height)
          imageData.data.set(frameData)
          ctx.putImageData(imageData, 0, 0)

          frames.push(canvas)
          frameDelays.push(frameInfo.delay * 10)
        }

        imageCache.set(cacheKey, {
          frames,
          frameDelays,
          width,
          height,
          numFrames,
          isAnimated: true,
        })

        animationState.set(cacheKey, {
          currentFrame: 0,
          lastFrameTime: Date.now(),
        })
      } catch (error) {
        console.warn(`Failed to load animated GIF ${cacheKey}:`, error)
        imageCache.delete(cacheKey)
      }
    }

    magnets.forEach((magnet) => {
      if (magnet.sprite && magnet.spriteCategory) {
        const cacheKey = `${magnet.spriteCategory}/${magnet.sprite}`
        if (!imageCache.has(cacheKey)) {
          const isAnimated = isAnimatedImage(magnet.sprite)
          const imageUrl = `/img/canvas/${magnet.spriteCategory}/${magnet.sprite}`

          if (isAnimated) {
            loadAnimatedGif(cacheKey, imageUrl)
          } else {
            const img = new Image()

            img.onload = () => {}

            img.onerror = () => {
              console.warn(`Failed to load sprite image: ${magnet.spriteCategory}/${magnet.sprite}`)
              imageCache.delete(cacheKey)
            }

            img.src = imageUrl
            imageCache.set(cacheKey, img)
          }
        }
      }
    })
  }, [magnets])

  return { imageCacheRef, animationStateRef }
}
