const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const contractServices = require("../services/contracts");

router.post("/", auth, admin, (req, res) => {
  contractServices.createContract(req, res);
});

router.get("/", auth, admin, (req, res) => {
  contractServices.getAllContracts(req, res);
});

module.exports = router;
