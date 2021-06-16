const winston = require("winston");
const express = require("express");

const config = require("config");
const app = express();

const dotenv = require('dotenv');
dotenv.config();

require("./startup/config")();
require("./startup/logging")();
require("./startup/cors")(app);
require("./startup/routes")(app);
require("./startup/swagger")(app);

require("./startup/db")();
require("./startup/validation")();

const port = process.env.PORT;
const server = app.listen(port, () =>
  winston.info(`Listening on port ${port}...`)
);

module.exports = server;
