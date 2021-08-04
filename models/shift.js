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
    employee: { type: Schema.Types.ObjectId, ref: "Employee" },
    date: { type: Date },
    time: {
      type: "object",
      start: { type: Schema.Types.Date },
      end: { type: Schema.Types.Date },
      break: { type: Schema.Types.Date },
      clockIn: { type: Schema.Types.Date },
      clockOut: { type: Schema.Types.Date}
    },
    milleage: { type: Number },
    meal: { type: Number },
    accommodation: { type: Number },
    perDiems: { type: Number },
    notes: { type: String },
    status: {
      type: String,
      enum: [
        "ACCEPTED",
        "REJECTED",
        "OUTDATED",
        "ONGOING",
        "COMPLETED",
        "PENDING",
      ],
      default: "PENDING",
    },
    admin: { type: Object },
    createdDate: { type: Date, default: new Date() },
  },
  { typePojoToMixed: false }
);

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = {
  Shift,
};
