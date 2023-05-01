const { validateShift, validateShiftOnUpdate } = require("../functions/shift");
const { Shift } = require("../models/shift");
const { Contract } = require("../models/contract");
const { Production } = require("../models/production");
const { Employee: User } = require("../models/employee"); // Using User schema in the user route
const winston = require("winston");
const { uploadReceiptDocument } = require("../functions/uploadPaymentReceipt");
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
const { notifyAdminUsers } = require("./admin");
const GenerateInvoice = require("./generateInvoice");
const { Mongoose } = require("mongoose");

const SHIFT_STATUS = {
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  ACCEPTED: "ACCEPTED",
  INPROGRESS: "INPROGRESS",
  COMPLETED: "COMPLETED",
  OUTDATED: "OUTDATED",
  CANCELED: "CANCELED",
};

const MAX_CLOCK_IN_TIME = process.env.MAX_CLOCK_IN_TIME;

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
          preferredShiftOption,
          invoice,
        }) => {
          let { production, location, outRate, contract, position } =
            contractInfo;

          production.locations.forEach((loc) => {
            if (loc._id.toString() === location.toString()) {
              location = loc;
            }
          });

          let totalPayable = _getTotalPayable(
            time,
            outRate,
            status,
            milleage,
            meal,
            accommodation,
            perDiems
          );

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
              invoice,
            },
            time,
            hours: calculateHours(time.start, time.end),
            date,
            employeesInSameShifts: [],
            notes,
            totalPayable,
          };
        }
      )
    );
    const filteredMappedShift = mappedShifts.filter(
      (s) => s.status !== SHIFT_STATUS.OUTDATED
    );

    res.send({ data: filteredMappedShift });
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

  if (status === SHIFT_STATUS.ACCEPTED) {
    await notifyAdminUsers(
      "Shift Accepted 💃🏼🕺🏼💃🏼",
      `${req.user.name.firstName} has accepted the assigned shift`
    );
  } else {
    await notifyAdminUsers(
      "Shift Rejected 😒🙈",
      `${req.user.name.firstName} rejected the assigned shift`
    );
  }

  return res.status(204).send("Done");
};

const _handleClockIn = async (shiftInDb, req, res) => {
  // TODO - Check user proximity to location- This is also implemented on the mobile app
  const checkIfCurrentDay = isDateEqual(new Date(), shiftInDb.date);
  if (!checkIfCurrentDay)
    return res
      .status(400)
      .send("Cannot clock you in at this time. It's not time yet.");

  const time = { ...shiftInDb.time };
  time.clockIn = `${new Date().getHours()}:${new Date().getMinutes()}`;
  shiftInDb.status = SHIFT_STATUS.INPROGRESS;
  shiftInDb.time = time;

  await shiftInDb.save();
  // notify admin users of clock in
  await notifyAdminUsers(
    "🚀🚀🚀 Just clocked in",
    `Hi, ${req.user.name.firstName} has clocked in for the shift at ${shiftInDb.contractInfo.contract.name}`
  );
  return res.status(204).send("Done");
};

const _handleClockOut = async (shiftInDb, req, res) => {
  const time = { ...shiftInDb.time };
  const hour =
    new Date().getHours() < 10
      ? `0${new Date().getHours()}`
      : new Date().getHours();

  time.clockOut = `${hour}:${new Date().getMinutes()}`;
  shiftInDb.status = SHIFT_STATUS.COMPLETED;
  shiftInDb.time = time;

  await shiftInDb.save();
  await notifyAdminUsers(
    "🏌🏾‍♂️🏌🏾‍♂️🏌🏾‍♂️ Just clocked out",
    `Hi, ${req.user.name.firstName} has clocked out for the shift at ${shiftInDb.contractInfo.contract.name}`
  );
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
  }).populate({ path: "contractInfo.contract", select: "name" });

  if (!shiftInDb) return res.status(404).send("Shift Not Found");

  if (shiftInDb.status === SHIFT_STATUS.OUTDATED)
    return res.status(400).send("Something is wrong");

  if (status.toLowerCase() === "clockin") {
    return await _handleClockIn(shiftInDb, req, res);
  }
  return await _handleClockOut(shiftInDb, req, res);
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
        preferredShiftOption,
      }) => {
        let { production, location, outRate, contract, position } =
          contractInfo;

        production.locations.forEach((loc) => {
          if (loc._id.toString() === location.toString()) {
            location = loc;
          }
        });

        const totalPayable = _getTotalPayable(
          time,
          outRate,
          status,
          milleage,
          meal,
          accommodation,
          perDiems
        );

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
          totalPayable: totalPayable,
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
    console.error(err);
    winston.error(
      "SOMETHING WRONG HAPPENED: USER ROUTE - shifts/me/dashboard -getDashboardDataForUser()",
      err.message
    );
    res.status(500).send(err.message);
  }
};

const _getTotalPayable = (
  time,
  outRate,
  status,
  milleage,
  meal,
  accommodation,
  perDiems
) => {
  const hours = calculateHours(time.clockIn, time.clockOut);
  let totalHoursPay = +outRate * hours;

  let totalPay = totalHoursPay + milleage + meal + accommodation + perDiems;

  if (status == SHIFT_STATUS.CANCELED) {
    totalPay = cancellationFee;
  }

  return `£ ${totalPay}`;
};

const userUpdateInvoice = async (req, res) => {
  const { invoiceId, status, note } = req.body;

  const shiftsInDb = await Shift.find({ "invoice.id": invoiceId });
  if (shiftsInDb.length == 0) return res.status(500).send("Operation failed");

  try {
    await Promise.all(
      shiftsInDb.map(async (shift) => {
        shift.invoice.isApproved = status === SHIFT_STATUS.ACCEPTED;
        shift.invoice.note = note;

        await shift.save();

        winston.info(
          `User updated Shift Invoice in DB. InvoiceNumber =>  ${invoiceId}`
        );
      })
    );
    res.status(200).send("Operation successful");
  } catch (err) {
    winston.error(
      `Error occured updating invoice in DB. InvoiceNumber =>  ${invoiceId}`
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

const getAllShifts = async (_req, res) => {
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
    const filteredMappedShift = mappedShifts.filter(
      (s) => s.status !== SHIFT_STATUS.OUTDATED
    );

    res.send(filteredMappedShift);
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

const getAllShiftsDetails = async (_req, res) => {
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
          invoice,
        }) => {
          let { production, location, outRate, contract } = contractInfo;

          production.locations.forEach((loc) => {
            if (loc._id.toString() === location.toString()) {
              location = loc;
            }
          });
          const hours = calculateHours(time.clockIn, time.clockOut);
          let totalHoursPay = +outRate * hours;

          let totalPay =
            totalHoursPay + milleage + meal + accommodation + perDiems;

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
            invoice,
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
        { cancellationFee: { $gt: 0 } },
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
          let totalHoursPay = +outRate * hours;

          let totalPay =
            totalHoursPay + milleage + meal + accommodation + perDiems;

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

    const { shiftsInfo, note } = req.body;
    try {
      await Promise.all(
        JSON.parse(shiftsInfo).map(async (shiftInfo) => {
          // populate payment table
          // update shift table

          const payment = new Payment({
            shiftId: shiftInfo._id,
            receiptUrl: `${req.filePath}`,
            uploadedBy: req.user._id,
            notes: note,
            employee: shiftInfo.employeeId,
            status: "PAID",
          });

          await payment.save();

          const shift = await Shift.findById(shiftInfo._id);
          shift.admin.isPaid = true;
          shift.admin.receiptUrl = `${req.filePath}`;
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

const _calculateTotalAmount = (items) => {
  if (!items) return;
  return items
    .map(({ totalPay, isChecked }) => (isChecked ? totalPay : 0))
    .reduce((sum, i) => sum + i, 0)
    .toFixed(2);
};

const _formatShiftForInvoice = (shifts) => {
  return shifts.map((shift) => ({
    description: shift.production,
    place: shift.location,
    role: "",
    times: `${shift.time.clockIn} - ${shift.time.clockOut}`,
    date: new Date(shift.date).toLocaleDateString(),
    hours: shift.hours,
    unitPrice: shift.outRate,
    amount: shift.totalPay?.toFixed(2),
    meal: shift.meal || 0,
    milleage: shift.milleage || 0,
    accommodation: shift.accommodation || 0,
    perDiems: shift.perDiems || 0,
    cc: 0,
    ulex: 0,
  }));
};

const _getSiaLicenseNumber = (documents) => {
  const siaDoc = documents.find((doc) => doc.type == "sia_license");
  if (!siaDoc) return;
  return { licenseNumber: siaDoc.doc_number, expiry: siaDoc.expiryDate };
};

const _getDataForGeneratingInvoice = (shifts, userInfo) => {
  const totalAmount = _calculateTotalAmount(shifts);

  const siaDoc = _getSiaLicenseNumber(userInfo.documents);

  const data = {
    invoiceNumber: new Mongoose().Types.ObjectId(),
    shifts: _formatShiftForInvoice(shifts),
    subTotal: totalAmount,
    total: totalAmount,
    date: new Date().toLocaleDateString(),
    userInfo: {
      name: userInfo.getFullName(),
      postCode: userInfo.contact.address.postCode,
      utr: userInfo.utrNumber,
      address: userInfo.getFullAddress(),
      siaLicense: siaDoc && siaDoc.licenseNumber,
      siaLicenseExpiry: siaDoc && new Date(siaDoc.expiry).toLocaleDateString(),
    },
  };

  return data;
};

const _updateInvoiceDetailInDb = async (shifts, invoiceUrl, invoiceNumber) => {
  try {
    await Promise.all(
      shifts.map(async (shiftInfo) => {
        const shift = await Shift.findById(shiftInfo._id);
        shift.invoice = {
          id: invoiceNumber,
          url: invoiceUrl,
        };

        await shift.save();

        winston.info(
          `Updated Shift Invoice in DB. InvoiceNumber =>  ${invoiceNumber}`
        );
      })
    );
  } catch (err) {
    winston.error(
      `Error occured updating invoice in DB. InvoiceNumber =>  ${invoiceNumber}`
    );
    throw err;
  }
};

const notifiyUserOnInvoice = async (expoPushTokens) => {
  if (expoPushTokens) {
    const pushData = {
      pushTokens: expoPushTokens,
      message: {
        text: "An invoice has been generated for your review",
        title: "Invoice Available",
      },
    };
    await notifyUsersViaPushNotifications(Array.of(pushData));
  }
};

const generateTimesheetInvoice = async (req, res) => {
  try {
    winston.info(
      `ShiftService [generateTimesheetInvoice]: Received request for user => `,
      req.body?.userId
    );
    const { userId, shifts } = req.body;
    if (!userId) return res.status(400).send("Operation Failed.");

    const userInfo = await User.findById(userId).select(
      "name email utrNumber contact.address documents expoPushTokens"
    );

    if (!userInfo) return res.status(400).send("Profile record not found");

    const invoiceGenerationData = _getDataForGeneratingInvoice(
      shifts,
      userInfo
    );

    const invoiceGenerator = new GenerateInvoice();
    const invoiceGeneratorResponse = await invoiceGenerator.execute(
      invoiceGenerationData
    );

    if (!invoiceGeneratorResponse.filename) {
      return res
        .status(500)
        .send("Error generating invoice. Please try again.");
    }

    const { filename: invoiceFilePath } = invoiceGeneratorResponse;

    // upload invoice to digital storage
    const result = await invoiceGenerator.uploadInvoice(
      invoiceFilePath,
      userId
    );

    invoiceGenerator.deleteFileFromDisk(invoiceFilePath);

    // update invoice details to shift information
    await _updateInvoiceDetailInDb(
      shifts,
      result.fileUploadPath,
      invoiceGenerationData.invoiceNumber
    );

    await notifiyUserOnInvoice(userInfo.expoPushTokens);
    res.status(200).send({
      message: "Invoice generated successfully",
      url: result.fileUploadPath,
    });

    // get user info
  } catch (error) {
    winston.error(
      `ShiftService [generateTimesheetInvoice]: Error occured => ${error.message}`
    );
    res.status(500).send("Something unexpected happened");
  }
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
  getAllMyShifts,
  updateMyShiftStatus,
  getDashboardDataForUser,
  manageClockInClockOut,
  generateTimesheetInvoice,
  userUpdateInvoice,
};
