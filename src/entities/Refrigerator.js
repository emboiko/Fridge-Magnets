const fs = require("fs");
const path = require("path");
const Magnet = require("./Magnet");
const Fridge = require("../models/Fridge");

class Refrigerator {
  constructor() {
    const radius = 30;
    const specials = "0123456789=#!?&♪↙↘↯";
    this.magnets = [];

    // Bulk random chars
    for (let i = 0; i < 250; i++) {
      this.magnets.push(new Magnet(
        Math.random() * (1800 - radius * 2) + radius + 1100,
        Math.random() * (3600 - radius * 2) + radius + 50,
        radius,
        this.generateCharacter()
      ));
    }

    //Two of each special char
    for (let i = 0; i < 2; i++) {
      Array.from(specials).forEach((special) => {
        this.magnets.push(new Magnet(
          Math.random() * (1800 - radius * 2) + radius + 1100,
          Math.random() * (3600 - radius * 2) + radius + 50,
          radius,
          special
        ));
      })
    }

    //One of each canvas image
    fs.readdir("./public/img/canvas", (err, files) => {
      if (err) console.log(err);
      else {
        files.forEach((file) => {
          this.magnets.push(new Magnet(
            Math.random() * (1800 - radius * 2) + radius + 1100,
            Math.random() * (3600 - radius * 2) + radius + 50,
            radius,
            "",
            path.basename(file)
          ));
        })
      }
    })
  }

  generateCharacter() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return characters.charAt(Math.floor(Math.random() * characters.length))
  }

  async loadMagnets() {
    // If we have a fridge in the DB, overwrite our mangets
    // with what comes back in the fridge:
    const fridge = await Fridge.findOne();
    if (fridge) this.magnets = [...fridge.magnets];
  }

}

module.exports = Refrigerator;