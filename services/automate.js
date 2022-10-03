const { Shift } = require("../models/shift");
const { Employee: User } = require("../models/employee"); // Using User schema in the user route
const { notifyUsersViaPushNotifications } = require("./notifications");
const {
  recreatedShiftDateWithTime,
  getDayOfTheWeekFromNumber,
} = require("../functions");

const _getDatesForDailyNotifications = () => {
  const _date = new Date();
  const tomorrow = _date.setDate(new Date().getDate() + 1);
  const nextTomorrow = _date.setDate(new Date().getDate() + 2);
  const tomorrowInISO = new Date(tomorrow).toISOString().split("T")[0];
  const nextTomorrowInISO = new Date(nextTomorrow).toISOString().split("T")[0];
  const todayInISO = new Date().toISOString().split("T")[0];

  return [todayInISO, tomorrowInISO, nextTomorrowInISO];
};

const _getUserInfoById = async (id) => {
  return await User.findById({ _id: id }).select("name email expoPushTokens");
};

const _getUsersDetailsFromShift = async (shifts) => {
  const userRecords = await Promise.all(
    shifts.map(async (shift) => {
      const userRecord = await _getUserInfoById(shift.employee);
      const { locations } = shift.contractInfo.production;
      const foundLocation = locations.find(
        (loc) => loc._id.toString() === shift.contractInfo.location.toString()
      );

      return {
        name: userRecord.name,
        email: userRecord.email,
        expoPushTokens: userRecord.expoPushTokens,
        shiftDate: shift.date,
        shiftDay: getDayOfTheWeekFromNumber(new Date(shift.date).getDay()),
        contract: shift.contractInfo.contract,
        shiftTime: shift.time.start,
        location: foundLocation,
      };
    })
  );

  return userRecords;
};

const sendShiftNotificationsToUsers = async (userRecords, message, title) => {
  userRecords.forEach(async (user) => {
    if (user.expoPushTokens) {
      const pushData = {
        pushTokens: user.expoPushTokens,
        message: {
          title: title || `🚀🚀🚀 Upcoming shift`,
          text:
            message ||
            `Hi ${user.name?.firstName}, you have an upcoming shift at ${user.location?.name} on ${user.shiftDay} at ${user.shiftTime}`,
        },
      };
      await notifyUsersViaPushNotifications(Array.of(pushData));
    }
  });
};

const _getNotStartedShifts = (shifts) => {
  const filteredShifts = [];
  shifts.forEach((shift) => {
    const recreatedDate = recreatedShiftDateWithTime(
      new Date(shift.date),
      shift.time.start
    ).getTime();

    const isShiftClockInTimePassed = Date.now() > recreatedDate;
    if (isShiftClockInTimePassed) return;

    filteredShifts.push(shift);
  });

  return filteredShifts;
};

const notifyUsersWithShiftFallingInCurrentDate = async () => {
  const [todayInISO, tomorrowInISO] = _getDatesForDailyNotifications();
  console.log(todayInISO, tomorrowInISO);
  const currentDayShifts = await Shift.find({
    date: { $gte: todayInISO, $lt: tomorrowInISO },
    status: { $in: ["PENDING", "ACCEPTED"] },
  })
    .populate({ path: "contractInfo.contract", select: "name" })
    .populate({ path: "contractInfo.production", select: "name locations" });

  if (!currentDayShifts || currentDayShifts.length === 0) return;
  const results = _getNotStartedShifts(currentDayShifts);
  if (!results || results.length === 0) return;
  const userRecords = await _getUsersDetailsFromShift(results);
  await sendShiftNotificationsToUsers(userRecords);
};

const notifyUsersOfUpcomingShifts = async () => {
  const [_, tomorrowInISO, nextTomorrowInISO] =
    _getDatesForDailyNotifications();
  const shifts = await Shift.find({
    date: { $gte: tomorrowInISO, $lt: nextTomorrowInISO },
    status: { $in: ["PENDING", "ACCEPTED"] },
  })
    .populate({ path: "contractInfo.contract", select: "name" })
    .populate({ path: "contractInfo.production", select: "name locations" });

  const results = _getNotStartedShifts(shifts);
  console.log(results);
  if (!results || results.length === 0) return;
  const userRecords = await _getUsersDetailsFromShift(results);

  await sendShiftNotificationsToUsers(userRecords);
};

// -notifications via app to staff to clock in 5mins before start of accepted shift.
const _getShiftsWithStartTimeLessThan5 = async () => {
  const fiveMinutes = 300000;

  const [todayInISO, tomorrowInISO] = _getDatesForDailyNotifications();
  const currentDayShifts = await Shift.find({
    date: { $gte: todayInISO, $lt: tomorrowInISO },
    status: { $in: ["PENDING", "ACCEPTED"] },
  }).populate({ path: "contractInfo.contract", select: "name" });

  if (!currentDayShifts || currentDayShifts.length === 0) return;

  const filteredShifts = [];
  currentDayShifts.forEach((shift) => {
    const recreatedDate = recreatedShiftDateWithTime(
      new Date(shift.date),
      shift.time.start
    ).getTime();

    const checkifWithinTimeFrame =
      Date.now() > recreatedDate - fiveMinutes && recreatedDate > Date.now();

    if (!checkifWithinTimeFrame) {
      return;
    }

    filteredShifts.push(shift);
  });

  return filteredShifts;
};

const _notifyUsersOfShiftsStartingIn5mins = async () => {
  const shifts = await _getShiftsWithStartTimeLessThan5();
  if (!shifts) return;
  const userRecords = await _getUsersDetailsFromShift(shifts);
  await sendShiftNotificationsToUsers(
    userRecords,
    "Your shift is starting soon. Remember to clock in 🙏🏽"
  );
};

const _getUsersWithShiftEndingIn5mins = async () => {
  const fiveMinutes = 300000;

  const [todayInISO, tomorrowInISO] = _getDatesForDailyNotifications();
  const ongoingShifts = await Shift.find({
    date: { $gte: todayInISO, $lt: tomorrowInISO },
    status: { $in: ["INPROGRESS"] },
  }).populate({ path: "contractInfo.contract", select: "name" });

  if (!ongoingShifts || ongoingShifts.length === 0) return;

  const filteredShifts = [];
  ongoingShifts.forEach((shift) => {
    const recreatedDate = recreatedShiftDateWithTime(
      new Date(shift.date),
      shift.time.end
    ).getTime();

    const checkifWithinTimeFrame =
      Date.now() > recreatedDate - fiveMinutes && recreatedDate > Date.now();

    if (!checkifWithinTimeFrame) {
      return;
    }

    filteredShifts.push(shift);
  });

  return filteredShifts;
};

const _notifyUsersOfShiftsEndingIn5mins = async () => {
  const shifts = await _getUsersWithShiftEndingIn5mins();
  if (!shifts) return;
  const userRecords = await _getUsersDetailsFromShift(shifts);
  await sendShiftNotificationsToUsers(
    userRecords,
    "Your shift is ending soon. Remember to clock out 🙏🏽",
    "🙌🏽🏌🏾‍♂️🚀 Your shift is ending soon."
  );
};

const minutes = async (req, res) => {
  // get all shift starting in 5 mins
  await _notifyUsersOfShiftsStartingIn5mins();
  // get all shift ending in 5 mins
  await _notifyUsersOfShiftsEndingIn5mins();
  res.send("Done!");
};

// tomorrow shift notifications
// should be run twice a  day
const daily = async (req, res) => {
  await notifyUsersOfUpcomingShifts();
  await notifyUsersWithShiftFallingInCurrentDate();

  res.send("Done!");
};

module.exports = {
  daily,
  minutes,
};
