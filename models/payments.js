const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  shiftId: { type: Schema.Types.ObjectId, ref: "Shift" },
  receiptUrl: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "Employee" },
  date: { type: Date, default: new Date() },
  notes: { type: String },
  employee: { type: Schema.Types.ObjectId, ref: "Employee"},
  status: { type: String }
});

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = {
  Payment,
};
