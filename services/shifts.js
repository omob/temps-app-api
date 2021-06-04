const { validateShift } = require("../functions/shift");
const { Shift } = require("../models/shift");
const winston = require("winston");
const { Production } = require("../models/production");

const createShift = async (req, res) => {
    const { error } = validateShift(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { 
        contract, employees, dates, time, milleage, meal, notes
    } = req.body

    const { id: contractId, production: { id: productionId, location: locationId }, outRate, position} = contract;

    try {

      if (dates.length === 0 && employees.length === 0) {
        const newShift = new Shift({
          contractInfo: {
            contract: contractId,
            production: productionId,
            location: locationId,
            outRate,
            position,
          },
          employee: employees[0],
          date: dates[0],
          time,
          milleage,
          meal,
          notes,
        });

        await newShift.save();
        winston.info("ACTION - CREATED NEW SHIFTS");
        return res.status(204).json({ data: newShift, message: "success" });
      }

      for (var i = 0; i < employees.length; i++) {
        for (var j = 0; j < dates.length; j++) {
          const newShift = new Shift({
            contractInfo: {
              contract: contractId,
              production: productionId,
              location: locationId,
              outRate,
              position,
            },
            employee: employees[i],
            date: dates[j],
            time,
            milleage,
            meal,
            notes,
          });
          await newShift.save();
        }
      }

      winston.info("ACTION - CREATED NEW SHIFTS");
      return res.status(204).json({ message: "success" });

    } catch (err) {
        winston.error("SOMETHING WRONG HAPPENED: ", err.message);
        res.status(500).send(err.message)
    }
}

const getAllShifts = async (req, res) => {
    // if query -> date, filter by date 
    const allShifts = await Shift.find({})
      .populate({ path: "contractInfo.contract", select: "name" })
      .populate({ path: "contractInfo.production", select: "name locations" })
    //   .populate({ path: "contractInfo.location", ref: "contractInfo.production.locations._id"})
     
    try {
      const newShift = await Promise.all(
        allShifts.map(async (shift) => {
          if (!shift.contractInfo.production) return shift;

          const shiftObject = shift.toObject();

          const { locations, ...otherProps } =
            shiftObject.contractInfo.production;
          shiftObject.contractInfo.production = otherProps;

          const foundLocation = locations.find(
            (loc) =>
              loc._id.toString() ===
              shiftObject.contractInfo.location.toString()
          );
          shiftObject.contractInfo.location = foundLocation;
          return shiftObject;
        })
      );

      res.send(newShift);

    } catch (err) {
      winston.error("SOMETHING WRONG HAPPENED: ", err.message);
      res.status(500).send(err.message);
    }
}

const updateShift = async (req, res) => {

}

const getShiftById = async (req, res) => {
  const { id } = req.params;
  const shiftInDb = await Shift.findById({ _id: id });

  res.send(shiftInDb)
}


module.exports = {
    createShift,
    getAllShifts,
    getShiftById
}