const express = require("express");
const helmet = require("helmet");
const socketio = require("socket.io");
const messageEmail = require("./email/email");
const Refrigerator = require("./entities/Refrigerator");
const Fridge = require("./models/Fridge");
require("./db/mongoose");

const app = express();
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
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
app.post("/suggestions", (req, res) => {
  let name = "Anonymous";
  let email = "Anonymous@refrigerator-magnets.com";

  if (req.body.email) email = req.body.email;
  if (req.body.name) name = req.body.name;

  const suggestion = req.body.suggestion;
  messageEmail(email, name, suggestion);
  res.render("submitted", { message: "Message submitted." });
});
app.get("*", (req, res) => {
  res.render("notfound");
});

const PORT = process.env.PORT;
const expressServer = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const io = socketio(expressServer);

(async () => {
  const refrigerator = new Refrigerator();
  await refrigerator.loadMagnets();

  io.on("connection", (socket) => {
    socket.emit("welcome", refrigerator.magnets);

    socket.on("magnetMove", (data) => {
      refrigerator.magnets[data.i].x = data.x;
      refrigerator.magnets[data.i].y = data.y;
    });
  });

  setInterval(() => {
    io.emit("update", refrigerator.magnets);
  }, 33);

  setInterval(async () => {
    fridge = await Fridge.findOne();
    if (!fridge) {
      new Fridge({ ...refrigerator.magnets }).save();
    } else {
      fridge.magnets = [...refrigerator.magnets];
      fridge.save();
    }
  }, 1000); // I have no idea how frequently this should be happening 

})();  
