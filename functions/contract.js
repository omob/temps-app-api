const Joi = require("joi");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const nameSchema = () =>
  Joi.string()
    .regex(/^[A-Z]+$/)
    .uppercase();

function validateContract(contract) {
  const schema = {
    name: nameSchema().required(),
    contactNumber: Joi.string(),
    email: Joi.string().min(5).max(255).required().email(),
    businessType: Joi.string(),
    address: Joi.object().keys({
      line1: Joi.string(),
      line2: Joi.string().allow(null).allow(""),
      city: Joi.string().allow(null).allow(""),
      state: Joi.string(),
      country: Joi.string(),
      postCode: Joi.string().required(),
    }),
    productions: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().label("Production Name"),
        licenses: Joi.array(),
        locations: Joi.array().items(
          Joi.object().keys({
            name: Joi.string().label("Location Name"),
            address: Joi.object()
              .keys({
                line1: Joi.string().label("Location Address Line 1"),
                city: Joi.string().label("Location city"),
                state: Joi.string().label("Loaction State"),
                postCode: Joi.string().required().label("Location Postcode"),
              })
          })
        ),
      })
    ),
    inRate: Joi.number(),
  };

  return Joi.validate(contract, schema);
}

function validateContractOnUpdate(contract) {
  const schema = {
    name: nameSchema().required(),
    contactNumber: Joi.string(),
    email: Joi.string().min(5).max(255).required().email(),
    businessType: Joi.string(),
    address: Joi.object().keys({
      line1: Joi.string(),
      line2: Joi.string().allow(null).allow(""),
      city: Joi.string().allow(null).allow(""),
      state: Joi.string(),
      country: Joi.string(),
      postCode: Joi.string().required(),
    }),
    productions: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().label("Production Name"),
        licenses: Joi.array(),
        locations: Joi.array().items(
          Joi.object().keys({
            name: Joi.string().label("Location Name"),
            address: Joi.object().keys({
              line1: Joi.string().label("Location Address Line 1"),
              city: Joi.string().label("Location city"),
              state: Joi.string().label("Loaction State"),
              postCode: Joi.string().required().label("Location Postcode"),
            }).required(),
          })
        ),
      })
    ),
    inRate: Joi.number(),
  };

  return Joi.validate(contract, schema);
}


module.exports = {
  validateContract,
  validateContractOnUpdate,
};
