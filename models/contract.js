const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contractSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    minlength: 5,
    email: true,
    maxlength: 255,
    unique: true,
  },
  invoiceEmail: {
    type: String,
    minlength: 5,
    email: true,
    maxlength: 255,
  },
  businessType: { type: String },
  contactNumber: { type: String, default: "" },
  address: {
    type: Object,
    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postCode: String,
  },
  inRate: { type: Number, default: 0 },
  createdDate: { type: Date, default: new Date() },
  productions: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Production" },
      isDeleted: { type: Boolean, default: false },
    },
  ],
});

const Contract = mongoose.model("Contract", contractSchema);

module.exports = {
  Contract,
};
