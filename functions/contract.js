const Joi = require("joi");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const nameSchema = () =>
  Joi.string()
    .regex(/^[A-Z]+$/)
    .uppercase();

function validateContract(contract) {
  const schema = {
    name: Joi.string().required(),
    contactNumber: Joi.string(),
    email: Joi.string().min(5).max(255).required().email(),
    businessType: Joi.string().allow(null).allow(""),
    address: Joi.object().keys({
      line1: Joi.string(),
      line2: Joi.string().allow(null).allow(""),
      city: Joi.string().allow(null).allow(""),
      state: Joi.string(),
      country: Joi.string().allow(null).allow(""),
      postCode: Joi.string().required(),
    }),
    productions: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().label("Production Name"),
        licenses: Joi.array().allow([]),
        locations: Joi.array().items(
          Joi.object().keys({
            name: Joi.string().label("Location Name"),
            address: Joi.object().keys({
              line1: Joi.string().label("Location Address Line 1"),
              city: Joi.string().label("Location city"),
              state: Joi.string().label("Location State"),
              country: Joi.string().label("Location Country"),
              postCode: Joi.string().required().label("Location Postcode"),
            }),
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
    _id: Joi.string(),
    name: Joi.string().required(),
    contactNumber: Joi.string(),
    email: Joi.string().min(5).max(255).required().email(),
    businessType: Joi.string().allow(null).allow(""),
    address: Joi.object().keys({
      line1: Joi.string(),
      line2: Joi.string().allow(null).allow(""),
      city: Joi.string().allow(null).allow(""),
      state: Joi.string(),
      country: Joi.string().allow(null).allow(""),
      postCode: Joi.string().required(),
    }),
    productions: Joi.array().items(
      Joi.object().keys({
        _id: Joi.string().label("Production Id"),
        name: Joi.string().required().label("Production Name"),
        licenses: Joi.array().allow([]),
        locations: Joi.array().items(
          Joi.object().keys({
            _id: Joi.string().label("Location Id"),
            name: Joi.string().label("Location Name"),
            address: Joi.object()
              .keys({
                line1: Joi.string().label("Location Address Line 1"),
                city: Joi.string().label("Location city"),
                state: Joi.string()
                  .label("Location State")
                  .allow(null)
                  .allow(""),
                country: Joi.string()
                  .label("Location Country")
                  .allow(null)
                  .allow(""),
                postCode: Joi.string().required().label("Location Postcode"),
              })
              .required(),
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
