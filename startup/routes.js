const express = require("express");

const users = require("../routes/users");
const auth = require("../routes/auth");
const contracts = require("../routes/contracts");
const main = require("../routes/main");
const shifts = require("../routes/shifts");
const test = require("../routes/test");


const error = require("../middleware/error");

module.exports = function (app) {
  app.use(express.json());
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/contracts", contracts);
  app.use("/api/main", main);
  app.use("/api/shifts", shifts);
  app.use("/api/test", test);


  app.use("/api/hello", (req, res) => res.send("Hello World"))
  app.use(error);
};
