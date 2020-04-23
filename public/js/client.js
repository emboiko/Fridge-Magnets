const socket = io();

class Magnet{
    constructor(x,y,radius, letter){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.letter = letter;
    }

    draw(){
        fridge.c.beginPath();
        fridge.c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);

        fridge.c.textAlign = "center";
        fridge.c.strokeStyle = "#FFFFFF";
        fridge.c.fillStyle = "#333333";
        fridge.c.textBaseline = "middle";
        fridge.c.font="40px Georgia";
        fridge.c.fillText(this.letter, this.x, this.y);
        fridge.c.stroke();
    }
}

class Fridge{
    constructor(){
        this.canvas = document.getElementById("fridge");
        this.c = this.canvas.getContext("2d");
        this.canvas.width = 5000;
        this.canvas.height = 4000;

        this.magnets = [];
    }
}

class Mouse{
    constructor(){
        self.x = undefined;
        self.y = undefined;
        self.dragging = false;
        self.magnetIndex = 0;
    }
}

const fridge = new Fridge();
const mouse = new Mouse();

///////////////////////////////////////////

const header_height = document.getElementById("header").offsetHeight;

fridge.canvas.addEventListener("mousedown", (e) => {
    mouse.x = e.clientX + document.documentElement.scrollLeft;
    mouse.y = e.clientY + document.documentElement.scrollTop - header_height;

    fridge.magnets.forEach((magnet, index) => {
    
        if ((mouse.x >= magnet.x - magnet.radius) && (mouse.x <= magnet.x + magnet.radius)) {
    
            if ((mouse.y >= magnet.y - magnet.radius) && (mouse.y <= magnet.y + magnet.radius)) {
                mouse.dragging = true;
                mouse.magnetIndex = index;
            }
        }
    });
});

fridge.canvas.addEventListener("mousemove", (e) => {
    if (mouse.dragging){
        const adjustedX = e.clientX + document.documentElement.scrollLeft;
        const adjustedY = e.clientY + document.documentElement.scrollTop - header_height;
        fridge.magnets[mouse.magnetIndex].x = adjustedX;
        fridge.magnets[mouse.magnetIndex].y = adjustedY;

        socket.emit("magnetMove", {
            x:adjustedX,
            y:adjustedY,
            i:mouse.magnetIndex
        });
    }
});

fridge.canvas.addEventListener("mouseup", () => {
    mouse.dragging = false;
    mouse.draggingBackground = false;
});

document.addEventListener("keydown", (e) => {
    if (e.keyCode == 87) document.documentElement.scrollTop -=35; //w
    if (e.keyCode == 83) document.documentElement.scrollTop +=35; //s
    if (e.keyCode == 81) document.documentElement.scrollLeft -=35; //q
    if (e.keyCode == 65) document.documentElement.scrollLeft -=35; //a
    if (e.keyCode == 69) document.documentElement.scrollLeft +=35; //a
    if (e.keyCode == 68) document.documentElement.scrollLeft +=35; //d
});

//////////////////////////////////////////////

socket.on("welcome", (magnets) => {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = (fridge.canvas.offsetWidth / 2) -(window.innerWidth /2) ;

    fridge.magnets = []; //Redundant, makes for a safe restart.
    magnets.forEach((magnet) => {
        fridge.magnets.push(new Magnet(magnet.x, magnet.y, magnet.radius, magnet.letter));
    });
});

socket.on("update", (magnets) => {
    fridge.magnets.forEach((magnet, i) => {
        magnet.x = magnets[i].x;
        magnet.y = magnets[i].y;
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
