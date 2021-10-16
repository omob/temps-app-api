const express = require("express");
const router = express.Router();
const Email = require("../services/email");
const winston = require("winston");
const { Expo } = require("expo-server-sdk");

// const fs = require("fs");
// const path = require("path");

// fs.readFile(path.join(__dirname, "../templates/user-registeration.html"), "utf8", (err, data) => {
//   if(err) return "Error";

//   let message = data;
//   message = message.replace("{{username}}", "James");
//   message = message.replace("{{password}}", "Hg999e9");
//   message = message.replace("{{url}}", process.env.HOSTURL)

//   new Email().sendMail("New User Registration", message, "info@deevcorp.com")
//   winston.info(message);
// });

router.get("/email", async (req, res) => {
  // send email to user and admin on payment
  await new Email().sendPasswordChangeNotification("aboayosam@gmail.com", {
    firstName: "James",
    lastName: "Williams",
  });
  res.send("done");
});

router.get("/push", async (req, res) => {
  await notifyUserViaPushNotifications(
    "ExponentPushToken[40f6QeEPKjkNPrv_Qp03R5]", 
    { text: "Hello from NodeJS"}
  );
    res.send("Success");
});

const notifyUserViaPushNotifications = async (pushToken, message) => {
  let expo = new Expo();
  const messages = [];
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
  }

  messages.push({
    to: pushToken,
    sound: "default",
    body: message.text,
    data: message.data,
  })

  try {
    let ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log(ticketChunk);
  } catch (error) {
    console.error(error);
  }

};

// const testPush = () => {
//   let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

//   // Create the messages that you want to send to clients
//   let messages = [];
//   for (let pushToken of somePushTokens) {
//     // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

//     // Check that all your push tokens appear to be valid Expo push tokens
//     if (!Expo.isExpoPushToken(pushToken)) {
//       console.error(`Push token ${pushToken} is not a valid Expo push token`);
//       continue;
//     }

//     // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
//     messages.push({
//       to: pushToken,
//       sound: "default",
//       body: "This is a test notification",
//       data: { withSome: "data" },
//     });
//   }

//   // The Expo push notification service accepts batches of notifications so
//   // that you don't need to send 1000 requests to send 1000 notifications. We
//   // recommend ts
//   // and to compress them (notifications with similar content will getyou batch your notifications to reduce the number of reques
//   // compressed).
//   let chunks = expo.chunkPushNotifications(messages);
//   let tickets = [];
//   (async () => {
//     // Send the chunks to the Expo push notification service. There are
//     // different strategies you could use. A simple one is to send one chunk at a
//     // time, which nicely spreads the load out over time:
//     for (let chunk of chunks) {
//       try {
//         let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//         console.log(ticketChunk);
//         tickets.push(...ticketChunk);
//         // NOTE: If a ticket contains an error code in ticket.details.error, you
//         // must handle it appropriately. The error codes are listed in the Expo
//         // documentation:
//         // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
//       } catch (error) {
//         console.error(error);
//       }
//     }
//   })();
// }

module.exports = router;
