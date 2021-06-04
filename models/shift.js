const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shiftSchema = new Schema(
  {
    contractInfo: {
      contract: { type: Schema.Types.ObjectId, ref: "Contract" },
      production: { type: Schema.Types.ObjectId, ref: "Production" },
      location: { type: Schema.Types.ObjectId },
      outRate: { type: Number },
      position: { type: String },
    },
    employee: { type: Schema.Types.ObjectId },
    date: { type: Date },
    time: {
      type: "object",
      start: { type: Schema.Types.Date },
      end: { type: Schema.Types.Date },
      break: { type: Schema.Types.Date },
    },
    milleage: { type: String },
    meal: { type: String },
    notes: { type: String },
    status: { type: String },
    isAccepted: { type: Schema.Types.Boolean, default: false },
    createdDate: { type: Date, default: new Date() },
  },
  { typePojoToMixed: false }
);

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = {
  Shift,
};
