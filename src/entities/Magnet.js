import { MAX_RGB_COLOR_VALUE } from "../lib/constants.js"

export class Magnet {
  constructor(x, y, radius, letter, sprite, spriteCategory = "regular") {
    this.x = x
    this.y = y
    this.radius = radius
    this.letter = letter
    this.sprite = sprite
    this.spriteCategory = spriteCategory
    this.color =
      "#" +
      Math.floor(Math.random() * MAX_RGB_COLOR_VALUE)
        .toString(16)
        .padStart(6, "0")
  }

  toObject() {
    const obj = {
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.color,
      spriteCategory: this.spriteCategory,
    }

    if (this.letter) {
      obj.letter = this.letter
    }

    if (this.sprite) {
      obj.sprite = this.sprite
    }

    return obj
  }
}
