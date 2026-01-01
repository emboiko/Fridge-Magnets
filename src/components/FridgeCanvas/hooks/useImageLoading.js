import { useEffect, useRef } from "react"

/**
 * Hook to manage image loading and caching
 */
export function useImageLoading(magnets) {
  const imageCacheRef = useRef(new Map())

  useEffect(() => {
    const imageCache = imageCacheRef.current

    magnets.forEach((magnet) => {
      if (magnet.sprite && !imageCache.has(magnet.sprite)) {
        const img = new Image()

        img.onload = () => {}

        img.onerror = () => {
          console.warn(`Failed to load sprite image: ${magnet.sprite}`)
          imageCache.delete(magnet.sprite)
        }

        img.src = `/img/canvas/${magnet.spriteCategory}/${magnet.sprite}`
        imageCache.set(magnet.sprite, img)
      }
    })
  }, [magnets])

  return imageCacheRef
}
