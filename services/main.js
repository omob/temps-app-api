const { Contract } = require("../models/contract");
const { Employee } = require("../models/employee");
const { SHIFT_STATUS } = require("./shifts");
const { Shift } = require("../models/shift");
const { licensesTypes } = require("../data/main.js");

const dashboardInfo = async (req, res) => {
  // Total People
  // Total Contract
  // Activities

  const activities = [];

  const employeeCount = await Employee.find({}).countDocuments();

  const contractCount = await Contract.find({}).countDocuments();

  const shiftsAwaitingConfirmationCount = await Shift.find({
    status: SHIFT_STATUS.COMPLETED,
    $or: [{ "admin.isChecked": undefined }, { "admin.isChecked": false }],
  }).countDocuments();

  const shiftsAwaitingPaymentCount = await Shift.find({
    status: SHIFT_STATUS.COMPLETED,
    "admin.isChecked": true,
    $or: [{ "admin.isPaid": undefined }, { "admin.isPaid": false }],
  }).countDocuments();

  if (shiftsAwaitingConfirmationCount > 0) {
    activities.push({
      id: new Date().getTime(),
      heading: "Timesheet pending confirmation ",
      message: `There  ${
        shiftsAwaitingPaymentCount > 1
          ? `are ${shiftsAwaitingConfirmationCount} shifts`
          : `is ${shiftsAwaitingConfirmationCount} shift`
      } awaiting review and confirmation`,
      type: "approval",
      url: "/admin/timesheet",
    });
  }

  if (shiftsAwaitingPaymentCount > 0) {
    activities.push({
      id: new Date().getTime(),
      heading: "Timesheet pending payment ",
      message: `There  ${
        shiftsAwaitingPaymentCount > 1
          ? `are ${shiftsAwaitingPaymentCount} shifts`
          : `is ${shiftsAwaitingPaymentCount} shift`
      } awaiting review and payment`,
      type: "approval",
      url: "/admin/timesheet",
    });
  }

  res.status(200).json({
    employeeCount,
    contractCount,
    activities,
  });
};

const stats = async (req, res) => {
  const employeeCount = await Employee.find({}).countDocuments();

  const contractCount = await Contract.find({}).countDocuments();

  res.status(200).json({
    employeeCount,
    contractCount,
  });
};

const getLicenses = async (req, res) => {
  res.status(200).json(licensesTypes);
};

module.exports = {
  dashboardInfo,
  stats,
  getLicenses,
};
