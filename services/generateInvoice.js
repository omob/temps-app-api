const pdf = require("pdf-creator-node");
const fs = require("fs");
const path = require("path");

class GenerateInvoice {
  invoicePath = path.join(__dirname, "../resources/uploads/staff/invoices");

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
}

module.exports = GenerateInvoice;
