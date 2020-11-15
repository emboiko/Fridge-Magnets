class Magnet {
  constructor(x, y, radius, letter, sprite) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.letter = letter;
    this.sprite = sprite;
    this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
  }
}

module.exports = Magnet;
