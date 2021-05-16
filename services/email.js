const nodemailer = require("nodemailer");
const config = require("config");
const winston = require("winston");
const { formatNumberWithComma } = require("../functions");

// host: "sanablissglobal.com",

module.exports = class Email {
  constructor() {
    this.transporter = nodemailer.createTransport({
      port: 587,
      host: config.email.host,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(subject, message, email) {
    const info = await this.transporter.sendMail({
      from: `"Sanabliss Global " <${config.email.user}>`, // sender address
      to: `${email}`, // list of receivers
      subject: `${subject}`, // Subject line
      html: `${message}`, // html body
    });
    console.log("Message sent: %s", info.messageId);

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }


  sendRenewalReminder = async (
    { name, email },
    { price: productPrice, name: productName },
    subscriptionPlan,
    remainingDays
  ) => {
    const message = `
     <h3>Hi ${name.firstName} </h3>
     
     <p>
     Please be informed your subscription to <b>${productName}</b> will be renewed in ${remainingDays} day${
      remainingDays > 1 ? "s" : ""
    }.</p>
     <p>Ensure you have enough funds in your account to keep your subscription active. </p>
    
    <p> Regards </p>
     <b>Sanabliss Billing Team</b>
    `;
    try {
      await this.sendMail("Subscription Reminder", message, email);
      winston.info(
        `Send reminder to ${name.firstName} ${name.lastName} on subscription payment date`
      );
    } catch (error) {
      winston.error("Error received: ", error);
    }
  };

  sendPasswordChangeNotification = async (email, name) => {
    const message = `
    <h3>Hi ${name.firstName} </h3>
    <p>Your password has been changed successfully. </p>
    <span>
      If you did not initiate this change, kindly reset your password immediately or contact our support for assistance.
    </span>

    <p> Regards </p>
    <b>Sanabliss Team </b>

    `;

    try {
      await this.sendMail("Password Reset", message, email);
      winston.info(`Password Changed by ${name.firstName} ${name.lastName}`);
    } catch (error) {
      winston.error("Error received: ", error);
    }
  };


};
