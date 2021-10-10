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

router.post("/resend-token", async (req, res) => {
  userServices.resendToken(req, res);
});

// user registering self
router.post("/", async (req, res) => {
  userServices.register(req, res);
});

router.post("/me/upload-document", async (req, res) => {
  userServices.uploadDocument(req, res);
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

router.get("/geocode", auth, admin, async (req, res) => {
  adminServices.getAllUsersSortingByGeoCode(req, res);
});
// get user profile (admin getting other users' profile)
router.get("/:id", auth, admin, validateObjectId, async (req, res) => {
  adminServices.getUserProfile(req, res);
});

// update user verification status
router.put("/verify-status", auth, admin, async (req, res) => {
  adminServices.userStatusVerification(req, res);
});

// accept user's document
router.put("/accept-document", auth, admin, async (req, res) => {
  adminServices.acceptUserDocument(req, res);
});

// reject user's document
router.put("/reject-document", auth, admin, async (req, res) => {
  adminServices.rejectUserDocument(req, res);
});

// admin update other user's profile
router.put("/:id", auth, admin, validateObjectId, async (req, res) => {
  adminServices.updateUserProfile(req, res);
});

router.get("/", auth, admin, async (req, res) => {
  adminServices.getAllUsers(req, res);
});

// admin upload 
router.post("/upload-document", async (req, res) => {
  adminServices.uploadDocument(req, res);
});

router.post("/profile-image", async (req, res) => {
  adminServices.uploadProfileImage(req, res);
});


router.delete("/:id", auth, admin, validateObjectId, async (req, res) => {
  adminServices.deleteUser(req, res);
});



module.exports = router;
