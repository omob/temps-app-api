const winston = require("winston");
const mongoose = require("mongoose");

module.exports = function () {
  const db = process.env.DB_CONN;
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // serverSelectionTimeoutMS: 5000,
    })
    .then(() => winston.info(`Connected to Mongo Database`))
    .catch((error) => winston.error("ERROR: ", error));
};
