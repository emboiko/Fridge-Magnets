const mongoose = require("mongoose");

const fridgeSchema = new mongoose.Schema({
  magnets: []
});

const Fridge = mongoose.model("Fridge", fridgeSchema);

module.exports = Fridge;
