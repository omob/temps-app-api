const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String, default: "" },
  },
  title: { type: String },
  gender: { type: String, required: true, enum: ["male", "female"] },
  email: {
    type: String,
    required: true,
    minlength: 5,
    email: true,
    maxlength: 255,
    unique: true,
  },
  contact: {
    type: Object,
    email: { type: String, default: this.email },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postCode: String,
    },
  },
  nextOfKin: {
    type: Object,
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    relationship: { type: String, default: "" },
    phoneNumber: {
      type: String,
      required: true,
    },
    contact: {
      type: Object,
      address: {
        type: Object,
        line1: { type: String, default: "" },
        line2: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        country: { type: String, default: "" },
        postCode: String,
      },
    },
  },

  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  canLogin: {
    type: Boolean,
    default: true,
    enum: [true, false],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  documents: [
    {
      type: Object,
      name: { type: String, default: "" },
      issueDate: { type: Date },
      expiryDate: { type: Date },
      url: { type: String, default: "" },
      addedDate: new Date(),
    },
  ],
  createdDate: { type: Date, default: new Date() },
  status: {
    type: String,
    required: true,
    default: "unverified",
    enum: ["verified", "unverified"],
  },
});

employeeSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: {
        firstName: this.name.firstName,
        lastName: this.name.lastName,
      },
      email: this.email,
      roles: this.userRoles,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: config.get("tokenExpiration"),
    }
  );

  return token;
};

employeeSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = {
  Employee
};
