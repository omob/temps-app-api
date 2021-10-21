const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const messagesService = require("../services/messages");

router.get("/me", auth, (req, res) => {
  messagesService.getAllMyMessages(req, res)
});

router.post("/", auth, (req, res) => {
  messagesService.createMessage(req, res);
});

router.get("/users/:userId", auth, admin, (req, res) => {
  messagesService.getMessages(req, res);
});

router.put("/:id", auth, (req, res) => {
  messagesService.postMessage(req, res);
});




module.exports = router;
