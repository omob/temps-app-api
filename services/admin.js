const { Employee: User } = require("../models/employee"); // Using User schema in the user route
const {
  validateAdminUser, getUserRoles, validateAdminUserOnUpdate,
} = require("../functions/user");
const { Roles } = require("../models/roles");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { uploadImage } = require("../functions/uploadImage");
const { uploadUserDocument } = require("../functions/uploadDocument");
const mongoose = require("mongoose");

const USER_STATUS = {
  VERIFIED : "verified",
  UNVERIFIED : "unverified"
};

const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee"
};

const registerUser = async (req, res) => {
  const { error } = validateAdminUser(req.body);
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

  // raise an event on completion. This can then be used to either send mail or log

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

  let userRole = await getUserRoles(id);
  userRole = userRole[USER_ROLES.ADMIN]
     ? USER_ROLES.ADMIN
     : USER_ROLES.EMPLOYEE;

  res.status(200).json({ ...userDocument.toObject(), role: userRole });
};

const updateUserProfile = async (req, res) => {
 const { id } = req.params;
 const { error } = validateAdminUserOnUpdate(req.body);
 if (error) return res.status(400).send(error.details[0].message);

 const { name, gender, email, contact, nextOfKin, canLogin } = req.body; 

 await User.findOneAndUpdate(
   { _id: id },
   {
     name,
     email,
     gender,
     contact,
     nextOfKin,
     canLogin: canLogin === undefined ? true : canLogin,
   }
 );
 res.status(200).json({ message: "success" });
};

const getAllUsers = async (req, res) => {
  const usersInDb = await User.find({}).select("name isDeleted status profileImageUrl");

  const users = await Promise.all(usersInDb.map(async user => {
    let userRole= await getUserRoles(user._id);
    
    userRole = userRole[USER_ROLES.ADMIN] ? USER_ROLES.ADMIN : USER_ROLES.EMPLOYEE;
    return { ...user._doc, role: userRole };
  }));

  res.send(users);
};

const _getDistanceBetweenLocationInMiles = (lat1, lat2, lon1, lon2) => {
    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    lon1 =  lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    // Haversine formula
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)
              + Math.cos(lat1) * Math.cos(lat2)
              * Math.pow(Math.sin(dlon / 2),2);
            
    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956
    // for miles
    let r = 3956;

    // calculate the result
    return c * r;
}

const getAllUsersSortingByGeoCode = async (req, res) => {
  
  const { longitude, latitude } = req.query;
  const usersInDb = await User.find({}).select(
    "name contact.address.location contact.address.postCode profileImageUrl"
  );

  const result = usersInDb.map(({ name, _id, contact, profileImageUrl }) => {
    if (!contact.address.location) {
      return {
        name,
        profileImageUrl,
        _id,
        postCode: contact.address.postCode,
        distanceInMiles: null,
      };
    }

    const { latitude: lat2, longitude: long2 } = contact.address.location;
    const distanceInMiles = _getDistanceBetweenLocationInMiles(
      latitude,
      lat2,
      longitude,
      long2
    );

    return {
      name,
      profileImageUrl,
      _id,
      postCode: contact.address.postCode,
      distanceInMiles,
    };
  });
  res.send(result.sort((a, b) => a.distanceInMiles < b.distanceInMiles));
}

const deleteUser = async (req, res) => {
  const { id: _id } = req.params;
  if (_id === req.user._id) return res.status(403).send("Cannot deleted Self");

  await User.findByIdAndUpdate({ _id }, { isDeleted: true });
  res.send("Deleted");
};

const uploadDocument = async (req, res) => {
  uploadUserDocument(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, message: err });
    if (req.file === undefined)
      return res.json({ success: false, message: "No file uploaded" });

    const {type, name, doc_name, doc_number, issueDate, expiryDate, userId } = req.body;

    const staff = await User.findOne({_id: userId});
    if (!staff) return res.json({ success: false, message: "user not found"});

    staff.documents.push({
      _id: mongoose.Types.ObjectId(),
      url: `${process.env.HOSTURL}/uploads/staff/documents/${req.file.filename}`,
      name,
      doc_name,
      doc_number,
      issueDate,
      expiryDate,
      type,
      verified: false,
      addedDate: new Date()
    });

    await staff.save();

    return res.json({
      success: true,
      message: "File Added Successfully",
    });

  });

}

const uploadProfileImage = async (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, message: err });
    if (req.file === undefined)
      return res.json({ success: false, message: "No file uploaded" });

    const { userId } = req.body;

    await User.findOneAndUpdate(
      { _id: userId },
      {
        profileImageUrl: `${process.env.HOSTURL}/uploads/staff/images/${req.file.filename}`,
      }
    );
  
    return res.json({
      success: true,
      message: "Profile Image Set Successfully",
    });
  });

}

const userStatusVerification = async (req, res) => {
  const { staffId, verification } = req.body;

  const result = await User.findOneAndUpdate(
    { _id: staffId },
    {
      status: verification
    }
  );

  if(!result) return res.status(404).send("Not found");
  
  res.status(200).json({ message: "success" });
};

const acceptUserDocument = async (req, res) => {
  const {staffId,
    documentId,
    isVerified} = req.body;

    await User.findOneAndUpdate(
      { 
        _id: staffId, 
        "documents._id": documentId
      },
      { $set: { "documents.$.verified": isVerified } }
    );
    res.status(200).json({ message: "success" });
}

const rejectUserDocument = async (req, res) => {
  const { staffId, documentId, note } = req.body;

  await User.findOneAndUpdate(
    {
      _id: staffId,
      "documents._id": documentId,
    },
    {
      $set: {
        "documents.$.verified": false,
        "documents.$.note": note,
        "documents.$.status": 'REJECTED',
      },
    }
  );
  res.status(200).json({ message: "success" });
}

module.exports = {
  acceptUserDocument,
  registerUser,
  getRoles,
  manageAccess,
  getUserProfile,
  getAllUsers,
  deleteUser,
  updateUserProfile,
  getAllUsersSortingByGeoCode,
  uploadDocument,
  uploadProfileImage,
  userStatusVerification,
  rejectUserDocument,
};
