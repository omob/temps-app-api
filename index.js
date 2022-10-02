const winston = require("winston");
const express = require("express");
const app = express();

const dotenv = require("dotenv");

dotenv.config();

app.use(express.static("resources"));

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

// const fileStorage = new FileStorage();
// fileStorage.upload("test", "myId.txt", "Hello there");
module.exports = server;
