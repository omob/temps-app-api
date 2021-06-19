const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  email: { type: "string", required: true },
  userId: { type: "string", required: true },
  token: { type: "string", required: true },
  tokenExpirationDate: { type: "date", required: true },
  createdDate: { type: "date", default: new Date().toDateString()}
});

const Token = mongoose.model("Token", TokenSchema);

module.exports = {
  Token
};
