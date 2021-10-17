const nodemailer = require("nodemailer");
const config = require("config");
const winston = require("winston");

module.exports = class Email {
  constructor() {
    this.transporter = nodemailer.createTransport({
      name: config.get("domainName"),
      port: process.env.EMAILPORT,
      host: process.env.EMAILHOST,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(subject, message, email) {
    try {
      const info = await this.transporter.sendMail({
          from: `"MLS Protection " <${process.env.EMAILUSER}>`, // sender address
          to: `${email}`, // list of receivers
          subject: `${subject}`, // Subject line
          html: `${message}`, // html body
        });
        winston.info("Message sent: %s", info.messageId);
        // winston.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      winston.error("Error sending mail. " + error);
    }
    
  }

  sendPasswordChangeNotification = async (email, name) => {
    const message = `
      <h3>Hi ${name.firstName} </h3>
      <p>Your password has been changed successfully. </p>
      <span>
        If you did not initiate this change, kindly reset your password immediately or contact our support for assistance.
      </span>

      <p> Regards </p>
      <b>MLS Protection Team </b>
    `;

    try {
      await this.sendMail("Password Reset", message, email);
      winston.info(`Password Changed by ${name.firstName} ${name.lastName} and Email has been sent to user`);
    } catch (error) {
      winston.error("Error received: ", error);
    }
  };

  sendToken = async (email, name, token, expirationTime = 10) => {
    const message = `
    <h3>Hi ${name.firstName} </h3>
    <p>You have initiated a password reset action</p>
    <span>
      Please enter the token <b>${token}</b> to reset your password. This token will expire in ${expirationTime}mins
    </span>
    <br />
    <br />
    <code> If you did not initiate a password reset, kindly disregard this email </code>
    <p> Regards </p>
    <b>MLS Protection Team </b>
    `;

    try {
      await this.sendMail("Password Reset Notification", message, email);
      winston.info(`Password Change request email by ${name.firstName} ${name.lastName} sent` );
    } catch (error) {
      winston.error(`Error received why sending email to: ${email}`, error);
    }
  };

};
