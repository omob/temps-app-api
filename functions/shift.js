const Joi = require("joi");

function validateShift(shiftInfo) {
    const schema = {
      contract: Joi.object().keys({
        _id: Joi.string().label("Contract ID").required(),
        production: Joi.object().keys({
          _id: Joi.string().label("Production ID").required(),
          locationId: Joi.string().label("Location Id").required(),
        }),
        outRate: Joi.number().label("Out Rate").required(),
        position: Joi.string().label("Position").allow(null).allow(""),
      }),
      employees: Joi.array().items(
         Joi.object().keys({
          _id: Joi.string().label("Employee Id").required(),
          name: Joi.string(),
          distanceInMiles: Joi.number().allow(null),
          profileImageUrl: Joi.string().optional()
         })
      ),
      dates: Joi.array(),
      time: Joi.object().keys({
        start: Joi.string().label("Start Time").required(),
        end: Joi.string().label("End Time").required(),
        break: Joi.string().label("Break").allow(null).allow(""),
      }),
      milleage: Joi.string().label("Milleage").optional().allow(""),
      meal: Joi.string().optional().allow(""),
      accommodation: Joi.string().optional().allow(""),
      perDiems: Joi.string().optional().allow(""),
      notes: Joi.string().label("Notes").allow(null).allow(""),
    };

    return Joi.validate(shiftInfo, schema);
}

function validateShiftOnUpdate (shiftInfo) {
  const schema = {
    _id: Joi.string().label("Shift ID"),
    contract: Joi.object().keys({
      _id: Joi.string().label("Contract ID").required(),
      production: Joi.object().keys({
        _id: Joi.string().label("Production ID").required(),
        locationId: Joi.string().label("Location Id").required(),
      }),
      outRate: Joi.number().label("Out Rate").required(),
      position: Joi.string().label("Position").allow(null).allow(""),
    }),
    employee: Joi.string().required(),
    date: Joi.string().required(),
    time: Joi.object().keys({
      start: Joi.string().label("Start Time"),
      end: Joi.string().label("End Time"),
      break: Joi.string().label("Break").allow(null).allow(""),
    }),
    milleage: Joi.number().label("Milleage").optional().allow("").allow(null),
    meal: Joi.number().optional().allow("").allow(null),
    accommodation: Joi.number().optional().allow("").allow(null),
    perDiems: Joi.number().optional().allow("").allow(null),
    notes: Joi.string().label("Notes").allow(null).allow(""),
  };

  return Joi.validate(shiftInfo, schema);
}

module.exports = {
  validateShift,
  validateShiftOnUpdate,
};