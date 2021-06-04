const express = require("express");
const admin = require("../middleware/admin");
const auth = require("../middleware/auth");
const router = express.Router();

const shiftsServices = require("../services/shifts")


router.post("/", auth, admin, (req, res) => {
    shiftsServices.createShift(req, res);
});

router.get("/", auth, admin, (req, res) => {
    shiftsServices.getAllShifts(req, res);
})

router.get("/:id", auth, admin, (req, res) => {
    shiftsServices.getShiftById(req, res);
})

router.put("/:id", auth, admin, (req, res) => {
    shiftsServices.updateShift(req, res);
})

router.post("/", (req, res) => res.send("Hello"));

module.exports = router;
