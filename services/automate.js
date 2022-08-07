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

      return {
        name: userRecord.name,
        email: userRecord.email,
        expoPushTokens: userRecord.expoPushTokens,
        shiftDate: shift.date,
        shiftDay: getDayOfTheWeekFromNumber(new Date(shift.date).getDay()),
        contract: shift.contractInfo.contract,
        shiftTime: shift.time.start,
      };
    })
  );

  return userRecords;
};

const sendShiftNotificationsToUsers = async (userRecords) => {
  userRecords.forEach(async (user) => {
    if (user.expoPushTokens) {
      const pushData = {
        pushTokens: user.expoPushTokens,
        message: {
          text: `Hi ${user.name?.firstName}, you have an upcoming shift at ${user.contract.name} on ${user.shiftDay} at ${user.shiftTime}`,
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
  const currentDayShifts = await Shift.find({
    date: { $gt: todayInISO, $lt: tomorrowInISO },
    status: { $in: ["PENDING", "ACCEPTED"] },
  }).populate({ path: "contractInfo.contract", select: "name" });

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
    date: { $gt: tomorrowInISO, $lt: nextTomorrowInISO },
    status: { $in: ["PENDING", "ACCEPTED"] },
  }).populate({ path: "contractInfo.contract", select: "name" });

  const results = _getNotStartedShifts(shifts);
  if (!results || results.length === 0) return;
  const userRecords = await _getUsersDetailsFromShift(results);

  await sendShiftNotificationsToUsers(userRecords);
};

// tomorrow shift notifications
// should be run once per day
const daily = async () => {
  await notifyUsersOfUpcomingShifts();
  await notifyUsersWithShiftFallingInCurrentDate();
};

const minutes = async () => {};

module.exports = {
  daily,
  minutes,
};
