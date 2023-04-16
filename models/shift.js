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
      clockOut: { type: Schema.Types.Date },
    },
    milleage: { type: Number },
    meal: { type: Number },
    accommodation: { type: Number },
    cancellationFee: { type: Number },
    perDiems: { type: Number },
    notes: { type: String },
    shiftOptions: { type: "array", default: [] },
    preferredShiftOption: { type: String },
    status: {
      type: String,
      enum: [
        "ACCEPTED",
        "REJECTED",
        "OUTDATED",
        "INPROGRESS",
        "COMPLETED",
        "PENDING",
        "CANCELED",
      ],
      default: "PENDING",
    },
    admin: {
      notes: { type: String },
      isChecked: { type: Boolean },
      isPaid: { type: Boolean },
      approvedBy: { type: Schema.Types.ObjectId, ref: "Employee" },
      receiptUrl: { type: String },
    },
    invoice: {
      id: { type: String },
      url: { type: String },
      isApproved: { type: Boolean },
      approvalNote: { type: String },
    },
    createdDate: { type: Date, default: new Date() },
  },
  { typePojoToMixed: false }
);

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = {
  Shift,
};
