const pdf = require("pdf-creator-node");
const fs = require("fs");
const path = require("path");
const FileStorage = require("../functions/file-storage");
const winston = require("winston");
const util = require("util");

const fileStorage = new FileStorage();
class GenerateInvoice {
  invoicePath = path.join(__dirname, "../resources/uploads/staff/invoices");
  invoiceUploadPath = "resources/uploads/staff/invoices";
  invoiceTemplatePath = "../templates/invoice-template.html";

  invoiceOptions = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "0px",
    },
    footer: {},
  };

  constructor() {
    /* TODO document why this constructor is empty */
  }

  execute(data) {
    try {
      const templatePath = path.join(__dirname, this.invoiceTemplatePath);
      const template = fs.readFileSync(templatePath, "utf8");

      const document = {
        html: template,
        data: data,
        path: `${this.invoicePath}/${data.invoiceNumber}.pdf`,
        type: "",
      };
      return pdf.create(document, this.invoiceOptions);
    } catch (err) {
      winston.error(
        `GenerateInvoice [execute]: Error occured generating invoice =>  ${err}`
      );
    }
  }

  async uploadInvoice(filePath, userId) {
    try {
      const readFilePromise = util.promisify(fs.readFile);

      const data = await readFilePromise(filePath);
      const keyPath = this.invoiceUploadPath;

      const extName = path.extname(filePath).toLowerCase();
      const spacePath = `${userId}-${Date.now()}${extName}`;

      const response = await fileStorage.upload(
        keyPath,
        spacePath,
        data,
        "public-read"
      );
      winston.info(
        "GenerateInvoice [uploadInvoice] => upload response",
        response
      );
      return response;
    } catch (err) {
      winston.error(
        "GenerateInvoice [uploadInvoice]: Error occurred: " + err.message
      );
      throw err;
    }
  }

  deleteFileFromDisk = (filePath) => {
    fs.unlink(filePath, (err) => {
      if (err)
        winston.error(
          `Error deleting file from disk: ${err.message}. FilePath is ${filePath}`
        );
    });
  };
}

module.exports = GenerateInvoice;
