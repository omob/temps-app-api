const { validateShift, validateShiftOnUpdate } = require("../functions/shift");
const { Shift } = require("../models/shift");
const winston = require("winston");
const { Production } = require("../models/production");

const SHIFT_STATUS = {
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  ACCEPTED: "ACCEPTED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  OUTDATED: "OUTDATED"
};

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

const _mapShiftToUi = (shift) => {
   if (!shift.contractInfo.production) return shift;

   const shiftObject = shift.toObject();

   const { locations, ...otherProps } = shiftObject.contractInfo.production;
   shiftObject.contractInfo.production = otherProps;

   const foundLocation = locations.find(
     (loc) =>
       loc._id.toString() === shiftObject.contractInfo.location.toString()
   );
   shiftObject.contractInfo.location = foundLocation;
   return shiftObject;
}


const getAllShifts = async (req, res) => {
    // if query -> date, filter by date 
    const allShifts = await Shift.find({})
      .populate({ path: "contractInfo.contract", select: "name" })
      .populate({ path: "contractInfo.production", select: "name locations" })
      .populate({ path: "employee", select: "name" })
      .select("-createdDate");
     
    try {
      const newShift = await Promise.all(
        allShifts.map(async (shift) => {
         return _mapShiftToUi(shift)
        })
      );

      res.send(newShift);

    } catch (err) {
      winston.error("SOMETHING WRONG HAPPENED: ", err.message);
      res.status(500).send(err.message);
    }
}

const updateShift = async (req, res) => {
    const { id } = req.params;
    const { error } = validateShiftOnUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { 
      contract, employee, date, time, milleage, meal, notes
    } = req.body;

    const {
      id: contractId,
      production: { id: productionId, location: locationId },
      outRate,
      position,
    } = contract;
    
    const shiftInDb = await Shift.findById(id);
    if(!shiftInDb) return res.status(404).send("Shift Not Found");

    if(shiftInDb.status === SHIFT_STATUS.OUTDATED) return res.status(400).send("Cannot update outdated shift");

    if (employee.toString() !== shiftInDb.employee.toString()) {
      // shift has been assigned to someone else, change status of shift
      shiftInDb.status = SHIFT_STATUS.OUTDATED;
      await shiftInDb.save();       
        
      const newShift = new Shift({
        contractInfo: {
          contract: contractId,
          production: productionId,
          location: locationId,
          outRate,
          position,
        },
        employee,
        date,
        time,
        milleage,
        meal,
        notes,
      });

      await newShift.save();

      winston.info("ACTION - CREATED NEW SHIFTS");
      return res.status(204).send("Done"); 
    }

    shiftInDb.contractInfo = {
      contract: contractId,
      production: productionId,
      location: locationId,
      outRate,
      position,
    };
    shiftInDb.data = date;
    shiftInDb.time = time;
    shiftInDb.milleage = milleage;
    shiftInDb.meal = meal;
    shiftInDb.notes = notes;

    await shiftInDb.save();
    winston.info("ACTION - UPDATED SHIFT DETAIL");
    res.status(204).send(shiftInDb);
}

const getShiftById = async (req, res) => {
  const { id } = req.params;
  const shiftInDb = await Shift.findById({ _id: id })
    .populate({ path: "contractInfo.contract", select: "name" })
    .populate({ path: "contractInfo.production", select: "name locations" })
    .populate({ path: "employee", select: "name" })
    .select("-createdDate")

  if (!shiftInDb) return res.status(404).send("Not Found");

  const mappedShift = _mapShiftToUi(shiftInDb);

  res.send(mappedShift)
}

const deleteShift = async (req, res) => {
    const { id } = req.params;
    await Shift.deleteOne({ _id: id});

    winston.info("ACTION - DELETE SHIFT ");
    res.status(204).send("Deleted");
}


module.exports = {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
};