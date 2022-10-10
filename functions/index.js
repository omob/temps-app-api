const path = require("path");

const getDayOfTheWeekInNumber = (dayOfTheWeek) => {
  let dayInNo = 0;
  switch (dayOfTheWeek) {
    case "sunday":
      return (dayInNo = 0);
      break;
    case "monday":
      return (dayInNo = 1);
      break;
    case "tuesday":
      return (dayInNo = 2);
      break;
    case "wednesday":
      return (dayInNo = 3);
      break;
    case "thursday":
      return (dayInNo = 4);
      break;
    case "friday":
      return (dayInNo = 5);
      break;
    case "saturday":
      return (dayInNo = 6);
      break;
    default:
      break;
  }

  return dayInNo;
};

const differenceInDays = (startDay, endDay) => {
  let numberOfDays = 0;
  const daysInAWeek = 7;
  for (let i = startDay; i < daysInAWeek + endDay; i++) {
    if (i != endDay) {
      numberOfDays++;
    } else break;
  }
  return numberOfDays;
};

const addDaysToDate = (date_, days) => {
  let copy = new Date(date_);
  copy.setDate(date_.getDate() + days);
  return copy;
};

function addMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

const generateNextBillingDate = (duration, billingDay) => {
  const billingDate = addDaysToDate(new Date(), duration);

  const difference = differenceInDays(
    billingDate.getDay(),
    getDayOfTheWeekInNumber(billingDay)
  );

  return addDaysToDate(billingDate, difference);
};

const formatNumberWithComma = (number) => {
  return number.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};

const getDayOfTheWeekFromNumber = (dayOfTheWeek) => {
  let dayInString = "";
  switch (dayOfTheWeek) {
    case 0:
      return "Sunday";
      break;
    case 1:
      return "Monday";
      break;
    case 2:
      return "Tuesday";
      break;
    case 3:
      return "Wednesday";
      break;
    case 4:
      return "Thursday";
      break;
    case 5:
      return "Friday";
      break;
    case 6:
      return "Saturday";
      break;
    default:
      break;
  }

  return dayInString;
};

const generateRandomNumbers = (length) => {
  let generatedNumbers = "";

  while (length !== 0) {
    generatedNumbers += Math.floor(Math.random() * 10);
    length--;
  }

  return generatedNumbers;
};

const isDateEqual = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const recreatedShiftDateWithTime = (date, startTime) => {
  const shiftDate = new Date(date);
  const shiftStartTimeHour = parseInt(startTime);
  const shiftStartTimeMinute = parseInt(startTime.split(":")[1]);

  return new Date(
    shiftDate.getFullYear(),
    shiftDate.getMonth(),
    shiftDate.getDate(),
    shiftStartTimeHour,
    shiftStartTimeMinute
  );
};

const calculateHours2 = (startTime, endTime) => {
  const _startTime = parseInt(startTime);
  const _endTime = parseInt(endTime);

  if (_startTime < _endTime) return _endTime - _startTime;

  // if (_endTime < _startTime && _startTime > 12) {
  //   const hours = _startTime - 12 + _endTime;
  //   return hours;
  // }
  if (_endTime < _startTime) return 24 - (_startTime - _endTime);

  if (_endTime == _startTime) return 0;
};

const calculateHours = (startTime, endTime) => {
  if (parseInt(endTime) == parseInt(startTime)) return 0;

  let startTimeHour = parseInt(startTime.split(":")[0]);
  let startTimeMinute = parseInt(startTime.split(":")[1]);

  let endTimeHour = parseInt(endTime.split(":")[0]);
  let endTimeMinute = parseInt(endTime.split(":")[1]);

  let differenceInHour = endTimeHour - startTimeHour;

  if (endTimeHour < startTimeHour) {
    differenceInHour = 24 - (startTimeHour - endTimeHour);
  }

  let minuteDifference = 0;
  if (startTimeMinute > endTimeMinute) {
    differenceInHour = differenceInHour - 1;

    endTimeMinute += 60; // add 60 minutes
    minuteDifference = endTimeMinute - startTimeMinute;
  } else {
    minuteDifference = endTimeMinute - startTimeMinute;
  }

  let minutes = minuteDifference / 60;

  let hourDifference = differenceInHour + minutes;

  return hourDifference.toFixed(2);
};

// Check file type
const checkFileType = (file, callback) => {
  // allowed ext
  const filetypes = /jpeg|jpg|png|gif|doc|docx|pdf/;
  // check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // check mime
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) return callback(null, true);
  return callback("Error: Invalid file type");
};

module.exports = {
  getDayOfTheWeekInNumber,
  differenceInDays,
  addDaysToDate,
  generateNextBillingDate,
  formatNumberWithComma,
  getDayOfTheWeekFromNumber,
  generateRandomNumbers,
  addMinutesToDate,
  isDateEqual,
  recreatedShiftDateWithTime,
  calculateHours,
  checkFileType,
  calculateHours2,
};
