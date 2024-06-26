const express = require("express");
const router = express.Router();

const mainServices = require("../services/main");

router.get("/dashboard", (req, res) => {
  mainServices.dashboardInfo(req, res);
});

router.get("/stats", (req, res) => {
  mainServices.stats(req, res);
});

router.get("/licenses", (req, res) => {
  mainServices.getLicenses(req, res);
});

module.exports = router;
