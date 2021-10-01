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
};
