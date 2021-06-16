const Joi = require("joi");
const { Roles } = require("../models/roles");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


  function validateUser(user) {
    const schema = {
      name: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        middleName: Joi.string().allow(null).allow(""),
      }),
      title: Joi.string().allow(null).allow(""),
      utrNumber: Joi.string().allow(null).allow(""),
      email: Joi.string().min(5).max(255).required().email(),
      contact: Joi.object()
        .keys({
          phoneNumber: Joi.string().required().label("contact phone number"),
          address: Joi.object().keys({
            line1: Joi.string(),
            line2: Joi.string().allow(null).allow(""),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            postCode: Joi.string(),
          }),
        })
        .required(),
      documents: Joi.array(),
      gender: Joi.string().required(),
      nextOfKin: Joi.object().keys({
        firstName: Joi.string().allow(null).allow(""),
        lastName: Joi.string().allow(null).allow(""),
        relationship: Joi.string().allow(null).allow(""),
        phoneNumber: Joi.string().required().label("Next of Kin Phone Number"),
        // contact: Joi.object().keys({
        //   address: Joi.object().keys({
        //     line1: Joi.string(),
        //     line2: Joi.string().allow(null).allow(""),
        //     city: Joi.string().allow(null).allow(""),
        //     state: Joi.string().allow(null).allow(""),
        //     country: Joi.string().allow(null).allow(""),
        //     postCode: Joi.string().allow(null).allow(""),
        //   }),
        // }),
      }),
      password: Joi.string().min(5).required()
    };

    return Joi.validate(user, schema);
  };

function validateUserOnUpdate(employee) {
    const schema = {
      name: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        middleName: Joi.string().allow(null).allow(""),
      }),
      title: Joi.string().allow(null).allow(""),
      utrNumber: Joi.string().allow(null).allow(""),
      email: Joi.string().min(5).max(255).required().email(),
      contact: Joi.object()
        .keys({
          phoneNumber: Joi.string().required().label("contact phone number"),
          address: Joi.object().keys({
            line1: Joi.string(),
            line2: Joi.string().allow(null).allow(""),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            postCode: Joi.string(),
          }),
        })
        .required(),
      documents: Joi.array(),
      gender: Joi.string().required(),
      nextOfKin: Joi.object().keys({
        firstName: Joi.string().allow(null).allow(""),
        lastName: Joi.string().allow(null).allow(""),
        relationship: Joi.string().allow(null).allow(""),
        phoneNumber: Joi.string().required().label("Next of Kin Phone Number"),
        // contact: Joi.object().keys({
        //   address: Joi.object().keys({
        //     line1: Joi.string(),
        //     line2: Joi.string().allow(null).allow(""),
        //     city: Joi.string().allow(null).allow(""),
        //     state: Joi.string().allow(null).allow(""),
        //     country: Joi.string().allow(null).allow(""),
        //     postCode: Joi.string().allow(null).allow(""),
        //   }),
        // }),
      }),
    };

  return Joi.validate(employee, schema);
}



function validatePassword(password) {
  const schema = {
    password: Joi.string().min(5).required(),
  };

  return Joi.validate(password, schema);
}

const getUserRoles = async (userId) => {
  const response = (await Roles.findOne({})).toObject();

  const userRoles = {};

  // find user roles
  Object.keys(response).map((key) => {
    if (typeof response[key] === "object" && key !== "_id") {
      try {
        let userIndex;
        userRoles[key] = Array.from(response[key]).map((userInDb, index) => {
          if (userInDb.userId === ObjectId(userId).toHexString()) {
            userIndex = index;
            return true;
          }
          return false;
        })[userIndex];
      } catch (e) {}
    }
    return false;
  });

  return userRoles;
};





// ADMIN USER ENTRY VALIDATION

  function validateAdminUser(user) {
    const schema = {
      name: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        middleName: Joi.string().allow(null).allow(""),
      }),
      title: Joi.string().allow(null).allow(""),
      utrNumber: Joi.string().allow(null).allow(""),
      email: Joi.string().min(5).max(255).required().email(),
      contact: Joi.object()
        .keys({
          phoneNumber: Joi.string().required().label("contact phone number"),
          address: Joi.object().keys({
            line1: Joi.string(),
            line2: Joi.string().allow(null).allow(""),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            postCode: Joi.string(),
          }),
        })
        .required(),
      documents: Joi.array(),
      gender: Joi.string().required(),
      nextOfKin: Joi.object().keys({
        firstName: Joi.string().allow(null).allow(""),
        lastName: Joi.string().allow(null).allow(""),
        relationship: Joi.string().allow(null).allow(""),
        phoneNumber: Joi.string()
          .allow(null)
          .allow("")
          .label("Next of Kin Phone Number"),
        // contact: Joi.object().keys({
        //   address: Joi.object().keys({
        //     line1: Joi.string(),
        //     line2: Joi.string().allow(null).allow(""),
        //     city: Joi.string().allow(null).allow(""),
        //     state: Joi.string().allow(null).allow(""),
        //     country: Joi.string().allow(null).allow(""),
        //     postCode: Joi.string().allow(null).allow(""),
        //   }),
        // }),
      }),
      canLogin: Joi.boolean(),
      role: Joi.string(),
      password: Joi.string().min(5).required(),
    };

    return Joi.validate(user, schema);
  };

function validateAdminUserOnUpdate(employee) {
  const schema = {
    name: Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      middleName: Joi.string().allow(null).allow(""),
    }),
    title: Joi.string().allow(null).allow(""),
    utrNumber: Joi.string().allow(null).allow(""),
    email: Joi.string().min(5).max(255).required().email(),
    contact: Joi.object()
      .keys({
        phoneNumber: Joi.string().required().label("contact phone number"),
        address: Joi.object().keys({
          line1: Joi.string(),
          line2: Joi.string().allow(null).allow(""),
          city: Joi.string(),
          state: Joi.string(),
          country: Joi.string(),
          postCode: Joi.string(),
        }),
      })
      .required(),
    documents: Joi.array(),
    gender: Joi.string().required(),
    nextOfKin: Joi.object().keys({
      firstName: Joi.string().allow(null).allow(""),
      lastName: Joi.string().allow(null).allow(""),
      relationship: Joi.string().allow(null).allow(""),
      phoneNumber: Joi.string().allow(null).allow("").label("Next of Kin Phone Number"),
      // contact: Joi.object().keys({
      //   address: Joi.object().keys({
      //     line1: Joi.string(),
      //     line2: Joi.string().allow(null).allow(""),
      //     city: Joi.string().allow(null).allow(""),
      //     state: Joi.string().allow(null).allow(""),
      //     country: Joi.string().allow(null).allow(""),
      //     postCode: Joi.string().allow(null).allow(""),
      //   }),
      // }),
    }),
    canLogin: Joi.boolean(),
    role: Joi.string(),
  };

  return Joi.validate(employee, schema);
}


module.exports = {
  validateUser,
  validateUserOnUpdate,
  validatePassword,
  getUserRoles,
  validateAdminUserOnUpdate,
  validateAdminUser
};
