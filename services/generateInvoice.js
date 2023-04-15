const pdf = require("pdf-creator-node");
const fs = require("fs");
const path = require("path");
const FileStorage = require("../functions/file-storage");

const fileStorage = new FileStorage();
class GenerateInvoice {
  invoicePath = path.join(__dirname, "../resources/uploads/staff/invoices");
  invoiceUploadPath = "resources/uploads/staff/invoices";

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
      const templatePath = path.join(
        __dirname,
        "../templates/invoice-template.html"
      );
      const template = fs.readFileSync(templatePath, "utf8");

      const document = {
        html: template,
        data: data,
        path: `${this.invoicePath}/${data.invoiceNumber}.pdf`,
        type: "",
      };
      return pdf.create(document, this.invoiceOptions);
    } catch (err) {
      console.error(err);
    }
  }

  async uploadInvoice(filePath) {
    fs.readFile(filePath, async (err, data) => {
      if (err) throw new Error(err);

      const keyPath = this.invoiceUploadPath;

      const extName = path.extname(filePath).toLowerCase();
      const spacePath = `invoice-${Date.now()}${extName}`;

      await fileStorage.upload(keyPath, spacePath, data, "public-read");
    });
  }
}

module.exports = GenerateInvoice;
