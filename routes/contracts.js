const express = require("express");
const router = express.Router();
const contractServices = require("../services/contracts");

router.post("/", (req, res) => {
    contractServices.createContract(req, res);
});

router.get("/", (req, res) => {
    res.send("Here")
});

module.exports = router;
