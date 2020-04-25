const express = require("express");
const helmet = require("helmet");
const socketio = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(helmet());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home");
});
app.get("/about", (req, res) => {
    res.render("about");
});
app.get("/suggestions", (req, res) => {
    res.render("suggestions");
});
app.get("*", (req, res) => {
    res.render("notfound");
});

const PORT = process.env.PORT;
const expressServer = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socketio(expressServer);

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

class Fridge {
    constructor() {
        const radius = 30;
        const specials = "0123456789=#!?&♪↙↘↯";
        this.magnets = [];

        // Bulk random chars
        for (let i = 0; i < 500; i++) {
            this.magnets.push(new Magnet(
                Math.random() * (4000 - radius * 2) + radius,
                Math.random() * (3700 - radius * 2) + radius + 50,
                radius,
                this.generateCharacter()
            ));
        }

        //Two of each special char
        for (let i = 0; i < 2; i++) {
            Array.from(specials).forEach((special) => {
                this.magnets.push(new Magnet(
                    Math.random() * (4000 - radius * 2) + radius,
                    Math.random() * (3700 - radius * 2) + radius + 50,
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
                        Math.random() * (4000 - radius * 2) + radius,
                        Math.random() * (3700 - radius * 2) + radius + 50,
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

}

const fridge = new Fridge();

io.on("connection", (socket) => {

    socket.emit("welcome", fridge.magnets);

    socket.on("magnetMove", (data) => {
        fridge.magnets[data.i].x = data.x;
        fridge.magnets[data.i].y = data.y;
    });

});

setInterval(() => {
    io.emit("update", fridge.magnets);
}, 33);
