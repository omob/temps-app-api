const express = require("express");
const router = express.Router();
const Email = require("../services/email");

router.get("/email", async (req, res) => {
  // send email to user and admin on payment
  await new Email().sendPasswordChangeNotification("aboayosam@gmail.com", { firstName: "James", lastName: "Williams"});
    res.send("done")
});

module.exports = router;
