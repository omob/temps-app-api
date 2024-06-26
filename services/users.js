const bcrypt = require("bcrypt");
const winston = require("winston");
const _ = require("lodash");
const { Employee: User } = require("../models/employee"); // Using User schema in the user route
const { Token } = require("../models/token");
const mongoose = require("mongoose");
const {
  validateUser,
  validateUserOnUpdate,
  validatePassword,
  validateEmail,
  validateResetPassword,
} = require("../functions/user");

const { generateRandomNumbers, addMinutesToDate } = require("../functions");
const { uploadUserDocument } = require("../functions/uploadDocument");
const { uploadImage } = require("../functions/uploadImage");

const Email = require("./email");
const { notifyAdminUsers } = require("./admin");

const MAX_MINUTES_BEFORE_TOKEN_EXPIRATION = 20;

const getProfile = async (req, res) => {
  const userDocument = await User.findById(req.user._id).select(
    "-password -isDeleted -__v -canLogin -expoPushTokens"
  );

  if (!userDocument) return res.status(404).send("User not found");

  const user = userDocument.toJSON();

  winston.info(
    `PROFILE FETCHED - ${user.name.firstName} ${user.name.lastName}`
  );
  res.status(200).json({ data: user, message: "success" });
};

const updateProfile = async (req, res) => {
  const { error } = validateUserOnUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { name, gender, dob, contact, nextOfKin } = req.body; // User should not be able to update email

  const updatedRecord = await User.findOneAndUpdate(
    { _id: req.user._id },
    {
      name,
      gender,
      contact,
      nextOfKin,
      dob,
    }
  );
  winston.info(`PROFILE UPDATED - ${name.firstName} ${name.lastName} `);
  res.status(200).json({ message: "success", data: updatedRecord });
};

// for signed in user
const changePassword = async (req, res) => {
  const { error } = validatePassword(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(password, salt);

  const { _id, email, name } = req.user;

  await User.findOneAndUpdate(
    { _id },
    {
      password: newPassword,
    }
  );

  await new Email().sendPasswordChangeNotification(email, name);
  res.send("Password changed");
};

const register = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { name, gender, email, contact, password, nextOfKin } = req.body;

  let user = await User.findOne({
    $or: [{ email }, { phoneNumber: contact.phoneNumber }],
  });

  if (user)
    return res
      .status(400)
      .json("User with same email or phone number already registered.");

  user = new User({
    name,
    email,
    gender,
    contact,
    password,
    nextOfKin,
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  winston.info("New user registered! " + user.name);
  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .status(201)
    .json({ data: _.pick(user, ["_id", "name", "email"]), message: "success" });
};

const _checkEmail = async (email) => {
  const user = await User.findOne({ email: email });

  if (!user) return false;

  return true;
};

const _saveTokenInDb = async (token, email, userId) => {
  // save token in DB
  const newToken = new Token({
    email: email,
    userId: userId,
    token: token,
    tokenExpirationDate: addMinutesToDate(
      new Date(),
      MAX_MINUTES_BEFORE_TOKEN_EXPIRATION
    ),
  });

  await newToken.save();
};

const forgotPassword = async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { email } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) {
    winston.info(`FORGOT PASSWORD - Email ${email} doest not exist`);
    return res.status(404).send("Email does not exist");
  }

  const token = generateRandomNumbers(5);
  await _saveTokenInDb(token, email, user._id);

  // send email to user
  new Email().sendToken(
    email,
    user.name,
    token,
    MAX_MINUTES_BEFORE_TOKEN_EXPIRATION
  );
  res.send("Success");
};

const resendToken = async (req, res) => {
  return await forgotPassword(req, res);
};

const resetPassword = async (req, res) => {
  // validate entry
  const { error } = validateResetPassword(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { email, token, password } = req.body;

  // check if token has expired
  const tokenInDb = await Token.findOne({ email, token: token.trim() });
  if (!tokenInDb) return res.status(404).send("Invalid email / token");

  if (new Date().getTime() > new Date(tokenInDb.tokenExpirationDate).getTime())
    return res.status(400).send("Token expired");

  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(password, salt);

  const _user = await User.findOneAndUpdate(
    { email },
    {
      password: newPassword,
    }
  );
  new Email().sendPasswordChangeNotification(email, _user.name);
  res.send("Password changed");
};

//mobile App - User upload Documents
const uploadDocument = async (req, res) => {
  uploadUserDocument(req, res, async (err) => {
    if (err) {
      winston.error("We have an error here", err);
      return res.status(500).json({ success: false, message: err });
    }

    if (req.file === undefined)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const { type, name, doc_name, doc_number, issueDate, expiryDate } =
      req.body;

    const staff = await User.findById(req.user._id);
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "user not found" });

    console.log(req.filePath);
    staff.documents.push({
      _id: mongoose.Types.ObjectId(),
      url: `${req.filePath}`,
      name,
      doc_name,
      doc_number,
      issueDate,
      expiryDate,
      type,
      verified: false,
      addedDate: new Date(),
    });

    await staff.save();
    await notifyAdminUsers(
      `📑 A new document has been uploaded`,
      `Hi, ${req.user.name.firstName} has uploaded a document for your review.`
    );
    winston.info("Success uploading new user document ");
    return res.json({
      success: true,
      message: "File Added Successfully",
    });
  });
};

const uploadProfileImage = async (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, message: err });

    if (req.file === undefined)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        profileImageUrl: `${req.filePath}`,
      }
    );

    return res.json({
      success: true,
      message: "Profile Image Set Successfully",
    });
  });
};

const addExpoPushTokens = async (req, res, next) => {
  const userId = req.user._id;
  const token = req.body.token;

  if (!token) return res.status(400).json({ message: "No token provided" });

  await User.findByIdAndUpdate(userId, {
    $addToSet: {
      expoPushTokens: token,
    },
  });

  res.status(200).json({ message: "Success adding expo push token" });
};

const getExpoPushTokens = async (userId) => {
  const tokens = await User.findById({ _id: userId }).select("expoPushTokens");
  if (!tokens) return;

  const { expoPushTokens } = tokens;
  return expoPushTokens;
};

module.exports = {
  getProfile,
  updateProfile,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
  resendToken,
  uploadDocument,
  uploadProfileImage,
  addExpoPushTokens,
  getExpoPushTokens,
};
