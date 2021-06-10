const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const contractServices = require("../services/contracts");
const validateObjectId = require("../middleware/validateObjectId");

router.post("/", auth, admin, (req, res) => {
  contractServices.createContract(req, res);
});

router.get("/", auth, admin, (req, res) => {
  contractServices.getAllContracts(req, res);
});


router.get("/dashboard", auth, admin, async (req, res) => {
  contractServices.getAllContractWithEmployeesCount(req, res);
});

router.get("/:id/empactive", auth, admin, validateObjectId, (req, res) => {
  contractServices.getEmployeesShiftInfo(req, res);
});

router.get("/:id", auth, admin, validateObjectId, async (req, res) => {
  contractServices.getContractProfile(req, res);
});

router.put("/:id", auth, admin, validateObjectId, (req, res) => {
  contractServices.updateContract(req, res);
});



module.exports = router;
