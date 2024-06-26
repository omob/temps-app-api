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
  dob: { type: String },
  utrNumber: { type: String },
  title: { type: String },
  gender: { type: String, enum: ["male", "female", ""] },
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
      unique: true,
    },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      county: { type: String, default: "" },
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
      _id: Schema.Types.ObjectId,
      name: { type: String, default: "" },
      issueDate: { type: Date },
      expiryDate: { type: Date },
      url: { type: String, default: "" },
      addedDate: { type: Date, default: new Date() },
      verified: { type: Boolean, default: false },
      doc_name: { type: String },
      doc_number: { type: String },
      type: { type: String },
      note: { type: String },
      status: { type: String },
    },
  ],
  createdDate: { type: Date, default: new Date() },
  status: {
    type: String,
    required: true,
    default: "unverified",
    enum: ["verified", "unverified"],
  },
  profileImageUrl: { type: String },
  expoPushTokens: { type: Array },
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
      profileImageUrl: this.profileImageUrl,
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

employeeSchema.methods.getFullName = function () {
  return `${this.name.firstName} ${this.name.lastName}`;
};

employeeSchema.methods.getFullAddress = function () {
  const address = this.contact.address;
  return `${address.line1} ${address.line1}, ${address.city} ${address.county}`;
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = {
  Employee,
};
