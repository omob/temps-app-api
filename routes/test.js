const express = require("express");
const router = express.Router();
const Email = require("../services/email");
const winston = require("winston");

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
  await new Email().sendPasswordChangeNotification("aboayosam@gmail.com", { firstName: "James", lastName: "Williams"});
    res.send("done")
});

module.exports = router;
