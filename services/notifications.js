const fs = require("fs");
const path = require("path");
const winston = require("winston");
const Email = require("./email");
const { Expo } = require("expo-server-sdk");

const sendEmailNotificationOnNewShift = (name, email, contractInfo, date) => {
  const { contract, production, location, address } = contractInfo;

  fs.readFile(
    path.join(__dirname, "../templates/new-shift.html"),
    "utf8",
    (err, data) => {
      if (err) return winston.error("Could not read new-shift.html file");

      let message = data;
      message = message.replace(
        "{{username}}",
        `${name.firstName} ${name.lastName}`
      );
      message = message.replace("{{contract}}", contract);
      message = message.replace("{{production}}", production);
      message = message.replace("{{location}}", location);
      message = message.replace("{{address}}", address);
      message = message.replace("{{date}}", new Date(date).toDateString());

      new Email().sendMail(
        "New shift has been assigned to you.",
        message,
        email
      );
      winston.info(
        `Email sent successfully to ${name.firstName} on new shift assignment `
      );
    }
  );
};

const notifyUsersViaPushNotifications = async (pushData) => {
  let expo = new Expo();
  const messages = [];

  for (let data of pushData) {
    if (!data.pushTokens || data.pushTokens.length === 0) continue;

    for (let token of data.pushTokens) {
      if (!Expo.isExpoPushToken(token)) {
        winston.error(`Push token ${token} is not a valid Expo push token`);
      }

      messages.push({
        to: token,
        sound: "default",
        title: data.message.title ?? "🔐 MLS Protection",
        body: data.message.text,
        data: data.message.data,
      });
    }
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        winston.info(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        winston.error("SENDING PUSH NOTIFICATION ERROR: " + error);
        console.error(error);
      }
    }
  })();
};

module.exports = {
  sendEmailNotificationOnNewShift,
  notifyUsersViaPushNotifications,
};
