const express = require("express");
const helmet = require("helmet");
const socketio = require("socket.io");

const app = express();
app.use(helmet());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home");
});

const PORT = process.env.PORT;
const expressServer = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socketio(expressServer);

class Magnet{
    constructor(x,y,radius, letter){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.letter = letter;
    }
}

class Fridge{
    constructor(){
        const radius = 30;
        this.magnets = [];
        
        for (let i=0; i<500; i++) {
            this.magnets.push(new Magnet(
                Math.random() * (5000-radius*2) + radius,
                Math.random() * (4000-radius*2) + radius,
                radius,
                this.generateCharacter()
            ));
        }
    }

    generateCharacter(){
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return characters.charAt(Math.floor(Math.random() * characters.length))
    }
}

const fridge = new Fridge();

io.on("connection", (socket) => {

    socket.emit("welcome", fridge.magnets);

    socket.on("magnetMove", (data) => {
        fridge.magnets[data.i].x = data.x;
        fridge.magnets[data.i].y = data.y;
        socket.broadcast.emit("update", fridge.magnets);
    });

});
