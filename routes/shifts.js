const express = require("express");
const admin = require("../middleware/admin");
const auth = require("../middleware/auth");
const router = express.Router();

const shiftsServices = require("../services/shifts")


router.post("/", auth, admin, (req, res) => {
    shiftsServices.createShift(req, res);
});

router.get("/shiftsDetails", auth, admin, (req, res) => {
  shiftsServices.getAllShiftsDetails(req, res);
});

router.get("/", auth, admin, (req, res) => {
    shiftsServices.getAllShifts(req, res);
})

// get all time sheet shifts for a user
router.get("/users/:id", auth, admin, (req, res) => {
  shiftsServices.getAllUserShifts(req, res);
});


// get all timesheet shifts for users
router.get("/users", auth, admin, (req, res) => {
  shiftsServices.getAllUsersShifts(req, res);
});

// update confirmation for user timesheet
router.put("/user/update-confirmation", auth, admin, (req, res) => {
  shiftsServices.updateUserShiftConfirmation(req, res);
});

// add payment invoice for shift and update isPaid for userTimesheet confirmation for user timesheet
router.post("/user/shift-payment", auth, admin, (req, res) => {
  shiftsServices.updateUserShiftPayment(req, res);
});


router.get("/:id", auth, admin, (req, res) => {
    shiftsServices.getShiftById(req, res);
})

router.put("/:id", auth, admin, (req, res) => {
    shiftsServices.updateShift(req, res);
})

router.delete("/:id", auth, admin, (req, res) => {
    shiftsServices.deleteShift(req, res);
})

router.post("/", (req, res) => res.send("Hello"));

module.exports = router;
