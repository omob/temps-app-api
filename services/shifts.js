const { validateShift, validateShiftOnUpdate } = require("../functions/shift");
const { Shift } = require("../models/shift");
const { Contract } = require("../models/contract");
const { Production } = require("../models/production");
const { Employee: User } = require("../models/employee"); // Using User schema in the user route
const winston = require("winston");
const { uploadReceiptDocument } = require("../functions/uploadInvoice");
const { Payment } = require("../models/payments");
const {
  isDateEqual,
  recreatedShiftDateWithTime,
  calculateHours,
} = require("../functions");
const {
  sendEmailNotificationOnNewShift,
  notifyUsersViaPushNotifications,
} = require("./notifications");

const SHIFT_STATUS = {
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  ACCEPTED: "ACCEPTED",
  INPROGRESS: "INPROGRESS",
  COMPLETED: "COMPLETED",
  OUTDATED: "OUTDATED",
  CANCELED: "CANCELED",
};

const MAX_CLOCK_IN_TIME = 900000; // 15mins

// get all shifts assigned to me
// get all shifts assigned to my colleagues for current day and same locaion

//////////////////////////////// USER ACTIONS ////////////////////////////////////////////////////////
const getAllMyShifts = async (req, res) => {
  const userId = req.user._id;
  try {
    const userInfo = await User.findById(userId).select("name");
    if (!userInfo) return res.status(500).send("Profile record not found");

    const allShifts = await Shift.find({
      employee: userId,
    })
      .populate({ path: "contractInfo.contract", select: "name" })
      .populate({ path: "contractInfo.production", select: "name locations" })
      .populate({ path: "admin.approvedBy", select: "name" })
      .select("-createdDate")
      .sort({ date: -1 }); // sorts by date descending order

    const mappedShifts = await Promise.all(
      allShifts.map(
        async ({
          _id,
          contractInfo,
          time,
          date,
          milleage,
          meal,
          accommodation,
          perDiems,
          notes,
          status,
          shiftOptions,
          preferredShiftOption
        }) => {
          let { production, location, outRate, contract, position } =
            contractInfo;

          production.locations.forEach((loc) => {
            if (loc._id.toString() === location.toString()) {
              location = loc;
            }
          });

          return {
            _id,
            status,
            contractInfo: {
              contract: contract.name,
              production: production.name,
              location: location.name,
              outRate,
              position,
              address: location.address,
              milleage,
              meal,
              accommodation,
              perDiems,
              shiftOptions,
              preferredShiftOption,
            },
            time,
            hours: calculateHours(time.start, time.end),
            date,
            employeesInSameShifts: [],
            notes,
          };
        }
      )
    );

    res.send({ data: mappedShifts });
  } catch (err) {
    winston.error(
      "SOMETHING WRONG HAPPENED: USER ROUTE - ALLSHIFT",
      err.message
    );
    res.status(500).send(err.message);
  }
};

const updateMyShiftStatus = async (req, res) => {
  const { status, shiftId, preferredShiftOption } = req.body;
  if (!status || !shiftId)
    return res.status(400).json("Status and Shift Id is required");

  const shiftInDb = await Shift.findOne({
    _id: shiftId,
    employee: req.user._id,
  });

  if (!shiftInDb) return res.status(404).send("Shift Not Found");

  if (shiftInDb.status === SHIFT_STATUS.OUTDATED)
    return res
      .status(400)
      .send(`Something is wrong. shift is ${SHIFT_STATUS.OUTDATED}`);

  shiftInDb.status = status;
  shiftInDb.preferredShiftOption = preferredShiftOption;

  await shiftInDb.save();

  return res.status(204).send("Done");
};

const _handleClockIn = async (shiftInDb, res) => {
  // TODO - Check user proximity to location- This is also implemented on the mobile app
  const checkIfCurrentDay = isDateEqual(new Date(), shiftInDb.date);
  if (!checkIfCurrentDay)
    return res
      .status(400)
      .send("Cannot clock you in at this time. It's not time yet.");

  const checkifWithinTimeFrame =
    Date.now() >
    recreatedShiftDateWithTime(
      new Date(shiftInDb.date),
      shiftInDb.time.start
    ).getTime() -
      MAX_CLOCK_IN_TIME;

  if (!checkifWithinTimeFrame)
    return res
      .status(400)
      .send("Cannot clock you in at this time. It's not time yet.");

  const time = { ...shiftInDb.time };
  time.clockIn = `${new Date().getHours()}:${new Date().getMinutes()}`;
  shiftInDb.status = SHIFT_STATUS.INPROGRESS;
  shiftInDb.time = time;

  await shiftInDb.save();
  return res.status(204).send("Done");
};

const _handleClockOut = async (shiftInDb, res) => {
  const time = { ...shiftInDb.time };
  const hour =
    new Date().getHours() < 10
      ? `0${new Date().getHours()}`
      : new Date().getHours();

  time.clockOut = `${hour}:${new Date().getMinutes()}`;
  shiftInDb.status = SHIFT_STATUS.COMPLETED;
  shiftInDb.time = time;

  await shiftInDb.save();
  return res.status(204).send("Done");
};

const manageClockInClockOut = async (req, res) => {
  const { status, shiftId } = req.body;
  if (!status || !shiftId)
    return res
      .status(400)
      .json("ClockIn or ClockOut Status and Shift Id is required");

  const shiftInDb = await Shift.findOne({
    _id: shiftId,
    employee: req.user._id,
  });

  if (!shiftInDb) return res.status(404).send("Shift Not Found");

  if (shiftInDb.status === SHIFT_STATUS.OUTDATED)
    return res.status(400).send("Something is wrong");

  if (status.toLowerCase() === "clockin") {
    return await _handleClockIn(shiftInDb, res);
  }
  return await _handleClockOut(shiftInDb, res);
};

// const shifts data for mobile app dashboard
const getDashboardDataForUser = async (req, res) => {
  const userId = req.user._id;
  try {
    const userInfo = await User.findById(userId).select("name");
    if (!userInfo) return res.status(500).send("Profile record not found");

    const allShifts = await Shift.find({
      employee: userId,
    })
      .populate({ path: "contractInfo.contract", select: "name" })
      .populate({ path: "contractInfo.production", select: "name locations" })
      .select("-createdDate")
      .sort({ date: 1 }); // sorts by date descending order

    const mappedShifts = allShifts.map(
      ({
        _id,
        contractInfo,
        time,
        date,
        milleage,
        meal,
        accommodation,
        perDiems,
        notes,
        status,
        shiftOptions,
        preferredShiftOption
      }) => {
        let { production, location, outRate, contract, position } =
          contractInfo;

        production.locations.forEach((loc) => {
          if (loc._id.toString() === location.toString()) {
            location = loc;
          }
        });

        return {
          _id,
          status,
          contractInfo: {
            contract: contract.name,
            production: production.name,
            location: location.name,
            outRate,
            position,
            address: location.address,
            latLng: location.address.location,
            milleage,
            meal,
            accommodation,
            perDiems,
          },
          time,
          hours: calculateHours(time.start, time.end),
          date,
          notes,
          shiftOptions,
          preferredShiftOption,
        };
      }
    );

    const pendingRequests = mappedShifts.filter(
      (shift) => shift.status === SHIFT_STATUS.PENDING
    );
    const upcomingShifts = mappedShifts.filter((shift) => {
      return (
        recreatedShiftDateWithTime(shift.date, shift.time.start).getTime() +
          MAX_CLOCK_IN_TIME >
          Date.now() && shift.status === SHIFT_STATUS.ACCEPTED
      );
    });
    // add open shifts data
    const openShifts = [];
    res.send({ data: { pendingRequests, upcomingShifts, openShifts } });
  } catch (err) {
    winston.error(
      "SOMETHING WRONG HAPPENED: USER ROUTE - shifts/me/dashboard -getDashboardDataForUser()",
      err.message
    );
    res.status(500).send(err.message);
  }
};

//////////////////////////////// ADMIN ACTIONS ///////////////////////////////////////////////////////

const getContractProductionLocationName = async (
  contractId,
  productionId,
  locationId
) => {
  const contractName = (
    await Contract.findById({ _id: contractId }).select("name")
  ).toObject().name;

  const production = await Production.findById({ _id: productionId });
  const productionName = production.name;

  let { name, address } = production.locations.find(
    (loc) => loc._id.toString() === locationId.toString()
  );

  address = `${address.line1} ${address.line2 || ""} ${address.city} ${
    address.county || ""
  } ${address.postCode}`;

  return { contractName, productionName, locationName: name, address };
};

const getUserInfoById = async (id) => {
  return await User.findById({ _id: id }).select("name email expoPushTokens");
};

const createShift = async (req, res) => {
  const { error } = validateShift(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    contract,
    employees,
    dates,
    time,
    milleage,
    meal,
    accommodation,
    perDiems,
    notes,
    shiftOptions,
  } = req.body;

  const {
    _id: contractId,
    production: { _id: productionId, locationId },
    outRate,
    position,
  } = contract;

  const { contractName, productionName, locationName, address } =
    await getContractProductionLocationName(
      contractId,
      productionId,
      locationId
    );

  try {
    if (dates.length === 1 && employees.length === 1) {
      const employeeId = employees[0]._id;
      const shiftDate = dates[0];

      const newShift = new Shift({
        contractInfo: {
          contract: contractId,
          production: productionId,
          location: locationId,
          outRate,
          position,
        },
        employee: employeeId,
        date: shiftDate,
        time,
        milleage,
        meal,
        accommodation,
        perDiems,
        notes,
        shiftOptions,
      });

      await newShift.save();

      const userInfo = await getUserInfoById(employeeId);
      sendEmailNotificationOnNewShift(
        userInfo.name,
        userInfo.email,
        {
          contract: contractName,
          production: productionName,
          location: locationName,
          address,
        },
        shiftDate
      );
      if (userInfo.expoPushTokens) {
        const pushData = {
          pushTokens: userInfo.expoPushTokens,
          message: { text: "A new shift has been assigned to you." },
        };
        await notifyUsersViaPushNotifications(Array.of(pushData));
      }

      winston.info(`ACTION - CREATED NEW SHIFT FOR ${userInfo.email}`);
      return res.status(204).json(newShift);
    }

    // refactor O(N^2)
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
          employee: employees[i]._id,
          date: dates[j],
          time,
          milleage,
          meal,
          accommodation,
          perDiems,
          notes,
          shiftOptions,
        });
        await newShift.save();

        const userInfo = await getUserInfoById(employees[i]._id);
        sendEmailNotificationOnNewShift(
          userInfo.name,
          userInfo.email,
          {
            contract: contractName,
            production: productionName,
            location: locationName,
            address,
          },
          dates[j]
        );
        winston.info(`ACTION - CREATED NEW SHIFTS FOR ${userInfo.email}`);
      }
    }

    winston.info("ACTION - CREATED NEW SHIFTS FOR MULTIPLE USERS");
    return res.status(204).json({ message: "success" });
  } catch (err) {
    winston.error("SOMETHING WRONG HAPPENED: HERE", err.message);
    res.status(500).send(err.message);
  }
};

const _mapShiftToUi = (shift) => {
  if (!shift.contractInfo.production) {
    const shiftObject = shift.toObject();
    shiftObject.time.hours = calculateHours(
      shiftObject.time.start,
      shiftObject.time.end
    );
    return shiftObject;
  }
  const shiftObject = shift.toObject();

  const { locations, ...otherProps } = shiftObject.contractInfo.production;
  shiftObject.contractInfo.production = otherProps;
  shiftObject.time.hours = calculateHours(
    shiftObject.time.start,
    shiftObject.time.end
  );

  const foundLocation = locations.find(
    (loc) => loc._id.toString() === shiftObject.contractInfo.location.toString()
  );
  shiftObject.contractInfo.location = foundLocation;
  return shiftObject;
};

const getAllShifts = async (req, res) => {
  // if query -> date, filter by date
  const allShifts = await Shift.find({})
    .populate({ path: "contractInfo.contract", select: "name" })
    .populate({ path: "contractInfo.production", select: "name locations" })
    .populate({ path: "employee", select: "name profileImageUrl" })
    .select("-createdDate");

  try {
    const mappedShifts = await Promise.all(
      allShifts.map(async (shift) => {
        return _mapShiftToUi(shift);
      })
    );
    res.send(mappedShifts);
  } catch (err) {
    winston.error("SOMETHING WRONG HAPPENED: ALLSHIFT", err.message);
    res.status(500).send(err.message);
  }
};

const updateShift = async (req, res) => {
  const { id } = req.params;
  const { error } = validateShiftOnUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    contract,
    employee,
    date,
    time,
    milleage,
    meal,
    accommodation,
    perDiems,
    notes,
    status,
    shiftOptions,
    cancellationFee,
  } = req.body;

  const {
    _id: contractId,
    production: { _id: productionId, locationId },
    outRate,
    position,
  } = contract;

  const shiftInDb = await Shift.findById(id);
  if (!shiftInDb) return res.status(404).send("Shift Not Found");

  if (shiftInDb.status === SHIFT_STATUS.OUTDATED)
    return res.status(400).send("Cannot update outdated shift");

  if (
    (time.clockIn || time.clockOut) &&
    shiftInDb.status !== SHIFT_STATUS.COMPLETED
  )
    return res
      .status(400)
      .send("Shift not completed. Cannot modify clockIn and clockout");

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
      accommodation,
      perDiems,
      notes,
      shiftOptions,
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
  shiftInDb.date = date;
  shiftInDb.time = time;
  shiftInDb.milleage = milleage;
  shiftInDb.meal = meal;
  shiftInDb.accommodation = accommodation;
  shiftInDb.perDiems = perDiems;
  shiftInDb.notes = notes;
  shiftInDb.status = status;
  shiftInDb.shiftOptions = shiftOptions;
  shiftInDb.cancellationFee = cancellationFee;

  await shiftInDb.save();
  winston.info("ACTION - UPDATED SHIFT DETAIL");
  res.status(204).send(shiftInDb);
};

const getShiftById = async (req, res) => {
  const { id } = req.params;
  const shiftInDb = await Shift.findById({ _id: id })
    .populate({ path: "contractInfo.contract", select: "name" })
    .populate({ path: "contractInfo.production", select: "name locations" })
    .populate({ path: "employee", select: "name" })
    .select("-createdDate");

  if (!shiftInDb) return res.status(404).send("Not Found");

  const mappedShift = _mapShiftToUi(shiftInDb);

  res.send(mappedShift);
};

const deleteShift = async (req, res) => {
  const { id } = req.params;
  await Shift.deleteOne({ _id: id });

  winston.info("ACTION - DELETE SHIFT ");
  res.status(204).send("Deleted");
};

const getAllShiftsDetails = async (req, res) => {
  const allShifts = await Shift.find({})
    .populate({ path: "contractInfo.contract", select: "name" })
    .populate({ path: "contractInfo.production", select: "name locations" })
    .populate({ path: "employee", select: "name" })
    .select("-createdDate");

  try {
    const mappedShifts = await Promise.all(
      allShifts.map(async (shift) => {
        return _mapShiftToUi(shift);
      })
    );

    const shiftsDetails = mappedShifts.map((ms) => ({
      _id: ms._id,
      name: ms.employee.name,
      userId: ms.employee._id,
      shiftInfo: {
        location: ms.contractInfo.location.name,
        time: `${ms.time.start} - ${ms.time.end}`,
        hours: calculateHours(ms.time.start, ms.time.end),
        date: ms.date,
      },
    }));

    res.send(shiftsDetails);
  } catch (err) {
    winston.error("SOMETHING WRONG HAPPENED: HERE", err.message);
    res.status(500).send(err.message);
  }
};

const getAllUserShifts = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const userInfo = await User.findById(userId).select("name");
    if (!userInfo) return res.status(500).send("User not found");

    const allShifts = await Shift.find({
      employee: userId,
      $or: [
        { status: SHIFT_STATUS.COMPLETED },
        { status: SHIFT_STATUS.CANCELED },
      ],
    })
      .populate({ path: "contractInfo.contract", select: "name" })
      .populate({ path: "contractInfo.production", select: "name locations" })
      .populate({ path: "admin.approvedBy", select: "name" })
      .select("-createdDate")
      .sort({ date: -1 }); // sorts by date descending order

    const mappedShifts = await Promise.all(
      allShifts.map(
        async ({
          contractInfo,
          time,
          _id,
          date,
          admin,
          milleage,
          meal,
          accommodation,
          perDiems,
          cancellationFee,
          status,
        }) => {
          let { production, location, outRate, contract } = contractInfo;

          production.locations.forEach((loc) => {
            if (loc._id.toString() === location.toString()) {
              location = loc;
            }
          });
          const hours = calculateHours(time.clockIn, time.clockOut);
          let totalPay = parseInt(outRate) * hours;

          totalPay +=
            milleage ||
            null + meal ||
            null + accommodation ||
            null + perDiems ||
            null;

          if (status == SHIFT_STATUS.CANCELED) {
            totalPay = cancellationFee;
          }

          return {
            _id,
            contract: contract.name,
            production: production.name,
            location: location.name,
            employeeId: userId,
            outRate,
            time,
            hours: hours,
            totalPay: totalPay,
            isPaid:
              admin.isPaid === undefined || admin.isPaid === false
                ? false
                : true,
            isChecked:
              admin.isChecked === undefined || admin.isChecked === false
                ? false
                : true,
            date,
            admin,
            milleage,
            meal,
            accommodation,
            perDiems,
            cancellationFee,
            status,
          };
        }
      )
    );

    res.send({ userInfo, shifts: mappedShifts });
  } catch (err) {
    winston.error("SOMETHING WRONG HAPPENED: ALLSHIFT", err.message);
    res.status(500).send(err.message);
  }
};

const getAllUsersShifts = async (req, res) => {
  const { isPaid } = req.query;
  try {
    const allShifts = await Shift.find({
      $or: [
        { status: SHIFT_STATUS.COMPLETED },
        { status: SHIFT_STATUS.CANCELED },
      ],
      "admin.isPaid": isPaid,
    })
      .populate({ path: "contractInfo.contract", select: "name" })
      .populate({ path: "contractInfo.production", select: "name locations" })
      .populate({ path: "employee", select: "name" })
      .populate({ path: "admin.approvedBy", select: "name" })
      .select("-createdDate")
      .sort({ date: -1 }); // sorts by date descending order

    const mappedShifts = await Promise.all(
      allShifts.map(
        async ({
          contractInfo,
          time,
          _id,
          date,
          admin,
          milleage,
          meal,
          accommodation,
          perDiems,
          employee,
          cancellationFee,
          status,
        }) => {
          let { production, location, outRate, contract } = contractInfo;

          production.locations.forEach((loc) => {
            if (loc._id.toString() === location.toString()) {
              location = loc;
            }
          });

          const hours = calculateHours(time.clockIn, time.clockOut);
          let totalPay = parseInt(outRate) * hours;
          totalPay +=
            milleage ||
            null + meal ||
            null + accommodation ||
            null + perDiems ||
            null;

          if (status == SHIFT_STATUS.CANCELED) totalPay = cancellationFee;

          return {
            _id,
            employee,
            contract: contract.name,
            production: production.name,
            location: location.name,
            outRate,
            time,
            hours: hours,
            totalPay: totalPay,
            isPaid:
              admin.isPaid === undefined || admin.isPaid === false
                ? false
                : true,
            isChecked:
              admin.isChecked === undefined || admin.isChecked === false
                ? false
                : true,
            date,
            admin,
            milleage,
            meal,
            accommodation,
            perDiems,
            status,
            cancellationFee,
          };
        }
      )
    );

    res.send({ shifts: mappedShifts });
  } catch (err) {
    winston.error("SOMETHING WRONG HAPPENED: getAllUsersShifts", err.message);
    res.status(500).send(err.message);
  }
};

const updateUserShiftConfirmation = async (req, res) => {
  const { shiftId, isChecked } = req.body;
  if (shiftId === undefined || isChecked === undefined)
    return res.status(400).send("ShiftId and isChecked are required");

  const shiftInDb = await Shift.findById(shiftId);
  if (!shiftInDb) return res.status(404).send("Shift Not Found");

  const result = await Shift.findByIdAndUpdate(shiftId, {
    status: shiftInDb.status,
    admin: {
      isChecked: isChecked,
      approvedBy: isChecked ? req.user._id : null,
    },
  });
  winston.info(
    `ACTION - UPDATED SHIFT INFO CONFIRMATION BY ${req.user.name.firstName} ${req.user.name.lastName}`
  );
  res.status(200).send(result);
};

const updateUserShiftPayment = async (req, res) => {
  uploadReceiptDocument(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, message: err });
    if (req.file === undefined)
      return res.json({ success: false, message: "No file uploaded" });

    const { shiftsInfo, note } = req.body;

    try {
      await Promise.all(
        JSON.parse(shiftsInfo).map(async (shiftInfo) => {
          // populate payment table
          // update shift table

          const payment = new Payment({
            shiftId: shiftInfo._id,
            receiptUrl: `${process.env.HOSTURL}/uploads/staff/receipts/${req.file.filename}`,
            uploadedBy: req.user._id,
            notes: note,
            employee: shiftInfo.employeeId,
            status: "PAID",
          });
          await payment.save();

          var shift = await Shift.findById(shiftInfo._id);
          shift.admin.isPaid = true;
          shift.admin.receiptUrl = `${process.env.HOSTURL}/uploads/staff/receipts/${req.file.filename}`;
          await shift.save();

          winston.info(
            `ACTION - UPDATED PAYMENT INFO FOR SHIFT BY ${req.user.name.firstName} ${req.user.name.lastName}`
          );
        })
      );

      return res.json({
        success: true,
        message: "Success updating record",
      });
    } catch (error) {
      winston.error(
        `ERROR OCCURED UPDATING PAYMENT INFO FOR SHIFT BY ${req.user.name.firstName} ${req.user.name.lastName}`
      );
      res.status(500).send("Something unexpected happened");
    }
  });
};

module.exports = {
  SHIFT_STATUS,
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  getAllShiftsDetails,
  getAllUserShifts,
  getAllUsersShifts,
  updateUserShiftConfirmation,
  updateUserShiftPayment,
  //usersInDb
  getAllMyShifts,
  updateMyShiftStatus,
  getDashboardDataForUser,
  manageClockInClockOut,
};
