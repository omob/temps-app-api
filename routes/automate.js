const express = require("express");
const { resolveContent } = require("nodemailer/lib/shared");
const router = express.Router();

const automateService = require("../services/automate");

router.post("/daily", (req, res) => {
  automateService.daily(req, res);
});

// every 5 minutes
router.post("/minutes", (req, res) => {
  automateService.minutes(req, res);
});

module.exports = router;
