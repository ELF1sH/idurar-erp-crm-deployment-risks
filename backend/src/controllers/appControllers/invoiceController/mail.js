const {SendInvoice} = require("@/emailTemplate/SendEmailTemplate");
const sendMail = require("@/services/sendMail");

const mail = async (req, res) => {
  const email = 'lezhnin495@gmail.com';
  const name = 'Doe'
  const subject = 'Invoice | idurar'
  const link = "induar.com";
  const type = 'invoice'
  const htmlContent = SendInvoice({ name });

  await sendMail({ email, name, subject, link, type, htmlContent })

  return res.status(200).json({
    success: true,
    result: null,
    message: 'Check tour mail to see invoice info',
  });
};

module.exports = mail
