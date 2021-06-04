const Joi = require("joi");

function validateShift(shiftInfo) {
    const schema = {
      contract: Joi.object().keys({
        id: Joi.string().label("Contract ID").required(),
        production: Joi.object().keys({
          id: Joi.string().label("Production ID").required(),
          location: Joi.string().label("Location Id").required(),
        }),
        outRate: Joi.number().label("Out Rate").required(),
        position: Joi.string().label("Position").allow(null).allow(""),
      }),
      employees: Joi.array(),
      dates: Joi.array(),
      time: Joi.object().keys({
        start: Joi.string().label("Start Time"),
        end: Joi.string().label("End Time"),
        break: Joi.string().label("Break").allow(null).allow(""),
      }),
      milleage: Joi.string().label("Milleage").allow(null).allow(""),
      meal: Joi.string().allow(null).allow(""),
      notes: Joi.string().label("Notes").allow(null).allow(""),
    };

    return Joi.validate(shiftInfo, schema);
}


module.exports = {
  validateShift
};