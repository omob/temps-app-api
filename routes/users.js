const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");

const userServices = require("../services/users");
const adminServices = require("../services/admin");

// route - api/users

router.get("/me", auth, (req, res) => {
  userServices.getProfile(req, res);
});

router.put("/me/change-password", auth, (req, res) => {
  userServices.changePassword(req, res);
});

router.put("/me", auth, (req, res) => {
  userServices.updateProfile(req, res);
});

// check if email exists
router.post("/forgot-password", async (req, res) => {
  userServices.forgotPassword(req, res);
});

router.post("/reset-password", async (req, res) => {
  userServices.resetPassword(req, res);
});

// user registering self
router.post("/", async (req, res) => {
  userServices.register(req, res);
});

/********************* ADMIN **************************/

// register new user - POST - /api/users
router.post("/register", auth, admin, async (req, res) =>
  adminServices.registerUser(req, res)
);

router.get("/roles", auth, admin, async (req, res) => {
  adminServices.getRoles(req, res);
});

router.put("/revoke", auth, admin, async (req, res) => {
  adminServices.manageAccess(req, res);
});

// get user profile (admin getting other users' profile)
router.get("/:id", auth, admin, validateObjectId, async (req, res) => {
  adminServices.getUserProfile(req, res);
});
// admin update other user's profile
router.put("/:id", auth, admin, validateObjectId, async (req, res) => {
  adminServices.updateUserProfile(req, res);
});

router.get("/", auth, admin, async (req, res) => {
  adminServices.getAllUsers(req, res);
});

router.delete("/:id", auth, admin, validateObjectId, async (req, res) => {
  adminServices.deleteUser(req, res);
});



module.exports = router;
