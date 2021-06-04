
const winston = require("winston");

const Logger = (action, name, type, message) => {
    winston[type](message);
    winston.info(`Action: ${action} MESSAGE: ${message}, NAME: ${name}`);
}


export default Logger;