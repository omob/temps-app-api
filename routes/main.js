const express = require("express");
const router = express.Router();

const mainServices = require("../services/main");

router.get("/dashboard", (req, res) => {
  mainServices.dashboardInfo(req, res)
});

module.exports = router;
