const express = require("express");
const router = express.Router();

const automateService = require("../services/automate");

router.post("/daily", (req, res) => {
  automateService.daily();
});

// every 5 minutes
router.post("/minutes", (req, res) => {
  automateService.minutes();
});

module.exports = router;
