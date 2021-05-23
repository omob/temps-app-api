const { Employee: User } = require("../models/employee"); // Using User schema in the user route
const {
  validateUser, getUserRoles, validateUserOnUpdate,
} = require("../functions/user");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { Roles } = require("../models/roles");

const USER_STATUS = {
  VERIFIED : "verified",
  UNVERIFIED : "unverified"
};

const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee"
};

const registerUser = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { name, gender, email, contact, password, nextOfKin, role } = req.body;

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
    status: role && role.toLowerCase() === "admin" ? USER_STATUS.VERIFIED : USER_STATUS.UNVERIFIED,
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  // add user to roles
  await Roles.findOneAndUpdate(
    {},
    {
      $addToSet: {
        [role]: {
          userId: user._id.toHexString(),
        },
      },
    }
  );
  res
    .status(201)
    .json({ data: {..._.pick(user, ["_id", "name", "email"]), role }, message: "success"});
};

const getRoles = async (req, res) => {
  const roles = await (await Roles.findOne({}).select("-_id -__v")).toJSON();

  const rolesObject = Object.keys(roles).map((role) => {
    return { _id: role, name: role };
  });

  res.send(rolesObject);
};

const manageAccess = async (req, res) => {
  const { email, canLogin } = req.body;
  const result = await User.findOneAndUpdate({ email }, { canLogin: canLogin });
  res.send(result && result.canLogin);
};

const getUserProfile = async (req, res) => {
  const { id } = req.params;
  const userDocument = await User.findById({ _id: id }).select(
    "-password"
  );

  if (!userDocument) return res.status(404).send("User not found");

  res.status(200).json({ data: userDocument, message: "success"});
};


const updateUserProfile = async (req, res) => {
 const { id } = req.params;
 const { error } = validateUserOnUpdate(req.body);
 if (error) return res.status(400).send(error.details[0].message);

 const { name, gender, email, contact, nextOfKin, status, canLogin } = req.body; // User should not be able to update email

 await User.findOneAndUpdate(
   { _id: id },
   {
     name,
     email,
     gender,
     contact,
     nextOfKin,
     status,
     canLogin: canLogin === null ? true : canLogin,
   }
 );
 res.status(200).json({ message: "success" });
};

const getAllUsers = async (req, res) => {
  const usersInDb = await User.find({}).select("name isDeleted status");

  const users = await Promise.all(usersInDb.map(async user => {
    let userRole= await getUserRoles(user._id);
    
    userRole = userRole[USER_ROLES.ADMIN] ? USER_ROLES.ADMIN : USER_ROLES.EMPLOYEE;
    return { ...user._doc, role: userRole };
  }));

  res.send(users);
};

const deleteUser = async (req, res) => {
  const { id: _id } = req.params;
  if (_id === req.user._id) return res.status(403).send("Cannot deleted Self");

  await User.findByIdAndUpdate({ _id }, { isDeleted: true });
  res.send("Deleted");
};

module.exports = {
  registerUser,
  getRoles,
  manageAccess,
  getUserProfile,
  getAllUsers,
  deleteUser,
  updateUserProfile,
};
