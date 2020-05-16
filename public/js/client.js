const socket = io();

class Magnet {
    constructor(x, y, radius, letter, color, sprite) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.letter = letter;
        this.color = color;
        this.sprite = sprite;

        if (this.sprite) {
            this.image = new Image();
            this.image.src = `/img/canvas/${this.sprite}`;
        }

    }

    draw() {
        fridge.c.textAlign = "center";
        fridge.c.fillStyle = this.color;
        fridge.c.textBaseline = "middle";
        fridge.c.font = "55px Luckiest Guy";
        fridge.c.strokeStyle = "#000000"
        fridge.c.fillText(this.letter, this.x, this.y);

        fridge.c.lineWidth = 3;
        fridge.c.strokeText(this.letter, this.x, this.y);

        if (this.sprite) {
            fridge.c.drawImage(this.image, this.x - this.image.width / 2, this.y - this.image.width / 2);
        }
    }
}

class Fridge {
    constructor() {
        this.canvas = document.getElementById("fridge");
        this.c = this.canvas.getContext("2d");
        this.canvas.width = 4000;
        this.canvas.height = 4000;

        this.magnets = [];
    }
}

class Mouse {
    constructor() {
        this.x = undefined;
        this.y = undefined;
        this.dragging = false;
        this.draggingBackground = false;
        this.magnetIndex = null;
    }
}

const fridge = new Fridge();
const mouse = new Mouse();

///////////////////////////////////////////

const header_height = document.getElementById("header").offsetHeight;

fridge.canvas.addEventListener("mousedown", (e) => {
    mouse.x = e.offsetX - document.documentElement.offsetLeft;
    mouse.y = e.offsetY + document.documentElement.offsetTop;
    fridge.magnets.forEach((magnet, index) => {

        if ((mouse.x >= magnet.x - magnet.radius) && (mouse.x <= magnet.x + magnet.radius)) {

            if ((mouse.y >= magnet.y - magnet.radius) && (mouse.y <= magnet.y + magnet.radius)) {
                mouse.dragging = true;
                mouse.magnetIndex = index;
            }
        }
    });

    if (!mouse.dragging) {
        mouse.draggingBackground = true;
    }
});

fridge.canvas.addEventListener("mousemove", (e) => {
    if (mouse.dragging) {
        const adjustedX = e.offsetX + document.documentElement.offsetLeft;
        const adjustedY = e.offsetY + document.documentElement.offsetTop;
        fridge.magnets[mouse.magnetIndex].x = adjustedX;
        fridge.magnets[mouse.magnetIndex].y = adjustedY;

        setTimeout(() => {
            socket.emit("magnetMove", {
                x: adjustedX,
                y: adjustedY,
                i: mouse.magnetIndex
            });
        }, 50);

    } else if (mouse.draggingBackground) {
        document.documentElement.scrollLeft -= e.movementX;
        document.documentElement.scrollTop -= e.movementY;
    }
});

fridge.canvas.addEventListener("mouseup", () => {
    mouse.dragging = false;
    mouse.draggingBackground = false;
    mouse.magnetIndex = null;
});
fridge.canvas.addEventListener("mouseout", () => {
    mouse.dragging = false;
    mouse.draggingBackground = false;
    mouse.magnetIndex = null;
});

document.addEventListener("keydown", (e) => {
    if (e.keyCode === 87) document.documentElement.scrollTop -= 35; //w
    if (e.keyCode === 83) document.documentElement.scrollTop += 35; //s
    if (e.keyCode === 81) document.documentElement.scrollLeft -= 35; //q
    if (e.keyCode === 65) document.documentElement.scrollLeft -= 35; //a
    if (e.keyCode === 69) document.documentElement.scrollLeft += 35; //a
    if (e.keyCode === 68) document.documentElement.scrollLeft += 35; //d

    if (e.keyCode === 72) home(); //h
});

const home = () => {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = (fridge.canvas.offsetWidth / 2) - (window.innerWidth / 2);
}

//////////////////////////////////////////////

socket.on("welcome", (magnets) => {
    home();

    fridge.magnets = []; //Redundant, makes for a safe restart.
    magnets.forEach((magnet) => {
        fridge.magnets.push(new Magnet(
            magnet.x,
            magnet.y,
            magnet.radius,
            magnet.letter,
            magnet.color,
            magnet.sprite
        ));
    });
});

socket.on("update", (magnets) => {
    fridge.magnets.forEach((magnet, i) => {
        if (mouse.magnetIndex !== i) {
            magnet.x = magnets[i].x;
            magnet.y = magnets[i].y;
        }
    });
});

//////////////////////////////////////////////

const animate = () => {
    requestAnimationFrame(animate);
    fridge.c.clearRect(0, 0, fridge.canvas.width, fridge.canvas.height);

    fridge.magnets.forEach((magnet) => {
        magnet.draw();
    });
}

animate();
