const bcrypt = require("bcrypt");
const winston = require("winston");
const _ = require("lodash");
const {
  Employee: User,
} = require("../models/employee"); // Using User schema in the user route
const {  
  validateUser,
  validateUserOnUpdate,
  validatePassword } = require("../functions/user");


const getProfile = async (req, res) => {
  const userDocument = await User.findById(req.user._id).select("-password -isDeleted -__v -canLogin");

  if (!userDocument) return res.status(404).send("User not found");

  const user = userDocument.toJSON();

  res.status(200).json({ data: user, message: "success"})
};

const updateProfile = async (req, res) => {
  const { error } = validateUserOnUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

 const { name, gender, contact, password, nextOfKin } = req.body; // User should not be able to update email

  await User.findOneAndUpdate(
    { _id: req.user._id },
    {
      name,
      gender,
      contact,
      password,
      nextOfKin,
    }
  );
  res.status(200).json({ message: "success"});
};

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

  // await new Email().sendPasswordChangeNotification(email, name);

  res.send("Password changed");
};

const register = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    name,
    gender,
    email,
    contact,
    password,
    nextOfKin
  } = req.body;

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
    nextOfKin
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
    .json({ data: _.pick(user, ["_id", "name", "email"]), message: "success"});
};


// const getSubscriptions = async (req, res) => {
//   const result = await Subscription.findOne({
//     userId: req.user._id,
//   })
//     .populate({
//       path: "subscriptions.productId",
//       model: "Product",
//     })
//     .populate({
//       path: "subscriptions.subscriptionPlan",
//       model: "SubscriptionPlan",
//     });

//   res.send((result && result.subscriptions) || []);
// };


module.exports = {
  getProfile,
  updateProfile,
  register,
  changePassword,
};
