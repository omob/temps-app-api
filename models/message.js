const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  isSenderAdmin: { type: Boolean },
  messages: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      text: { type: String },
      date: { type: Date },
    },
  ],
  createdDate: { type: "date", default: new Date().toDateString() },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = {
  Message,
};