/**
 * Refrigerator Entity
 *
 * Manages the collection of magnets with improved generation:
 * - Larger canvas support (6000x6000)
 * - Full canvas distribution
 * - Character count validation
 * - Better letter distribution
 */

import { readdir } from "fs/promises"
import { join, basename } from "path"
import { Magnet } from "./Magnet.js"
import { Fridge } from "../lib/db/Fridge.js"
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  NUMBERS,
  SYMBOLS,
  SPECIALS,
  EMOJIS,
  MAGNET_LETTER_RADIUS,
  MAGNET_SPRITE_RADIUS,
  BASE_LETTER_COUNT,
  MIN_LETTERS_PER_CHAR,
  NUMBERS_PER_CHAR_COUNT,
} from "../lib/constants.js"

export class Refrigerator {
  magnets = []

  constructor() {}

  /**
   * Generate a random uppercase letter with frequency weighting
   * Uses English letter frequency for better word-building
   * Based on standard English corpus analysis
   */
  generateCharacter() {
    const letterFrequencies = {
      E: 12.7,
      T: 9.1,
      A: 8.2,
      O: 7.5,
      I: 7.0,
      N: 6.7,
      S: 6.3,
      H: 6.1,
      R: 6.0,
      D: 4.3,
      L: 4.0,
      C: 2.8,
      U: 2.8,
      M: 2.4,
      W: 2.4,
      F: 2.2,
      G: 2.0,
      Y: 2.0,
      P: 1.9,
      B: 1.5,
      V: 1.0,
      K: 0.8,
      J: 0.2,
      X: 0.2,
      Q: 0.1,
      Z: 0.1,
    }

    const letters = Object.keys(letterFrequencies)
    const weights = letters.map((letter) => letterFrequencies[letter])

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let randomValue = Math.random() * totalWeight

    for (let i = 0; i < letters.length; i++) {
      randomValue -= weights[i]
      if (randomValue <= 0) {
        return letters[i]
      }
    }

    return letters[letters.length - 1]
  }

  /**
   * Count how many of each letter we have
   */
  countLetters() {
    const counts = new Map()
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    for (const letter of alphabet) {
      counts.set(letter, 0)
    }

    for (const magnet of this.magnets) {
      if (magnet.letter) {
        const count = counts.get(magnet.letter) || 0
        counts.set(magnet.letter, count + 1)
      }
    }

    return counts
  }

  /**
   * Ensure we have at least MIN_COUNT of each letter
   * Adds missing letters to reach minimum
   */
  ensureMinimumLetterCounts(minCount) {
    const counts = this.countLetters()

    for (const [letter, count] of counts.entries()) {
      if (count < minCount) {
        const needed = minCount - count
        for (let i = 0; i < needed; i++) {
          this.magnets.push(
            new Magnet(
              Math.random() * (CANVAS_WIDTH - CANVAS_PADDING * 2 - MAGNET_LETTER_RADIUS * 2) +
                MAGNET_LETTER_RADIUS +
                CANVAS_PADDING,
              Math.random() * (CANVAS_HEIGHT - CANVAS_PADDING * 2 - MAGNET_LETTER_RADIUS * 2) +
                MAGNET_LETTER_RADIUS +
                CANVAS_PADDING,
              MAGNET_LETTER_RADIUS,
              letter
            )
          )
        }
      }
    }
  }

  /**
   * - Distribute across full canvas
   * - Ensure minimum counts of each letter
   */
  async initializeMagnets() {
    this.magnets = []

    const availableWidth = CANVAS_WIDTH - CANVAS_PADDING * 2
    const availableHeight = CANVAS_HEIGHT - CANVAS_PADDING * 2

    // Base characters (letters)
    for (let i = 0; i < BASE_LETTER_COUNT; i++) {
      this.magnets.push(
        new Magnet(
          Math.random() * (availableWidth - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          Math.random() * (availableHeight - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          MAGNET_LETTER_RADIUS,
          this.generateCharacter()
        )
      )
    }

    // Two of each number
    for (let i = 0; i < NUMBERS_PER_CHAR_COUNT; i++) {
      for (const number of NUMBERS) {
        this.magnets.push(
          new Magnet(
            Math.random() * (availableWidth - MAGNET_LETTER_RADIUS * 2) +
              MAGNET_LETTER_RADIUS +
              CANVAS_PADDING,
            Math.random() * (availableHeight - MAGNET_LETTER_RADIUS * 2) +
              MAGNET_LETTER_RADIUS +
              CANVAS_PADDING,
            MAGNET_LETTER_RADIUS,
            number
          )
        )
      }
    }

    // One of each symbol
    for (const symbol of SYMBOLS) {
      this.magnets.push(
        new Magnet(
          Math.random() * (availableWidth - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          Math.random() * (availableHeight - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          MAGNET_LETTER_RADIUS,
          symbol
        )
      )
    }

    // One of each emoji
    for (const emoji of EMOJIS) {
      this.magnets.push(
        new Magnet(
          Math.random() * (availableWidth - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          Math.random() * (availableHeight - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          MAGNET_LETTER_RADIUS,
          emoji
        )
      )
    }

    // One of each special
    for (const special of SPECIALS) {
      this.magnets.push(
        new Magnet(
          Math.random() * (availableWidth - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          Math.random() * (availableHeight - MAGNET_LETTER_RADIUS * 2) +
            MAGNET_LETTER_RADIUS +
            CANVAS_PADDING,
          MAGNET_LETTER_RADIUS,
          special
        )
      )
    }

    // One of each standard (regular) canvas image
    try {
      const canvasDir = join(process.cwd(), "public", "img", "canvas", "regular")
      const files = await readdir(canvasDir)

      for (const file of files) {
        this.magnets.push(
          new Magnet(
            Math.random() * (availableWidth - MAGNET_SPRITE_RADIUS * 2) +
              MAGNET_SPRITE_RADIUS +
              CANVAS_PADDING,
            Math.random() * (availableHeight - MAGNET_SPRITE_RADIUS * 2) +
              MAGNET_SPRITE_RADIUS +
              CANVAS_PADDING,
            MAGNET_SPRITE_RADIUS,
            undefined,
            basename(file)
          )
        )
      }
    } catch (error) {
      console.error("Error reading canvas directory:", error)
    }

    this.ensureMinimumLetterCounts(MIN_LETTERS_PER_CHAR)

    const finalCounts = this.countLetters()
    const missingLetters = []
    for (const [letter, count] of finalCounts.entries()) {
      if (count < MIN_LETTERS_PER_CHAR) {
        missingLetters.push(letter)
      }
    }

    if (missingLetters.length > 0) {
      console.warn(`Warning: Still missing minimum counts for: ${missingLetters.join(", ")}`)
    } else {
      console.info(
        `Magnet generation complete: ${this.magnets.length} magnets with at least ${MIN_LETTERS_PER_CHAR} of each letter`
      )
    }
  }

  /**
   * Load magnets from database
   * If fridge exists in DB, use those magnets instead of defaults
   */
  async loadMagnets() {
    const fridge = await Fridge.findOne()

    if (fridge && fridge.magnets.length > 0) {
      this.magnets = fridge.magnets.map((magnetData) => {
        const magnet = new Magnet(
          magnetData.x,
          magnetData.y,
          magnetData.radius,
          magnetData.letter || undefined,
          magnetData.sprite,
          magnetData.spriteCategory
        )
        magnet.color = magnetData.color || magnet.color
        return magnet
      })
    } else {
      await this.initializeMagnets()
    }
  }

  /**
   * Save magnets to database
   */
  async save() {
    const fridge = await Fridge.findOne()

    const magnetsData = this.magnets.map((magnet) => magnet.toObject())

    if (!fridge) {
      await Fridge.create({ magnets: magnetsData })
    } else {
      fridge.magnets = magnetsData
      await fridge.save()
    }
  }

  /**
   * Get magnets as plain objects (for Socket.IO broadcasting)
   */
  getMagnetsAsObjects() {
    return this.magnets.map((magnet) => magnet.toObject())
  }
}
