const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locationSchema = new Schema({
  name: { type: "string", required: true },
  address: {
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postCode: { type: String, required: true },
  },
});

const Location = mongoose.model("Location", locationSchema);

module.exports = {
  Location
};
