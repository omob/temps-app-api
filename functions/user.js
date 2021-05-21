const Joi = require("joi");

const nameSchema = () => Joi.string()
  .regex(/^[A-Z]+$/)
  .uppercase();

  function validateUser(user) {
    const schema = {
      name: Joi.object().keys({
        firstName: nameSchema().required(),
        lastName: nameSchema().required(),
        middleName: nameSchema(),
      }),
      email: Joi.string().min(5).max(255).required().email(),
      password: Joi.string().min(5).max(255).required(),
      contact: Joi.object()
        .keys({
          phoneNumber: Joi.string()
            .required()
            .label("contact phone number"),
          address: Joi.object().keys({
            line1: Joi.string(),
            line2: Joi.string(),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            postCode: Joi.string(),
          }),
        })
        .required(),
      gender: Joi.string().required(),
      role: Joi.string(),
      nextOfKin: Joi.object().keys({
        firstName: nameSchema(),
        lastName: nameSchema(),
        relationship: Joi.string(),
        contact: Joi.object().keys({
          phoneNumber: Joi.string().required().label("Next of Kin Phone Number"),
          address: Joi.object().keys({
            line1: Joi.string(),
            line2: Joi.string(),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            postCode: Joi.string(),
          }),
        }),
      }),
    };

    return Joi.validate(user, schema);
  };

function validateUserOnUpdate(employee) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    phoneNumber: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    addressline1: Joi.string(),
    state: Joi.string(),
    city: Joi.string(),
  };

  return Joi.validate(employee, schema);
}

function validatePassword(password) {
  const schema = {
    password: Joi.string().min(6).required(),
  };

  return Joi.validate(password, schema);
}

module.exports = {
  validateUser,
  validateUserOnUpdate,
  validatePassword,
};
