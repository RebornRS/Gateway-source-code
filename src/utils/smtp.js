const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

const { SMTP_USERNAME, SMTP_PASSWORD, SMTP_SERVICE, SMTP_NAME } = process.env;

let transporter = nodemailer.createTransport({
  service: SMTP_SERVICE,
  secure:true,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

const handlebarOptions = {
  viewEngine: {
    extName: '.hbs',
    partialsDir: path.resolve('./src/views/mail/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./src/views/mail/'),
  extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

module.exports = {
  async SEND(RECEIVER, SUBJECT, TEMPLATE, CONTEXT) {
    let mailOptions = {
      from: `${SMTP_NAME} <${SMTP_USERNAME}>`,
      to: RECEIVER,
      subject: SUBJECT,
      template: TEMPLATE,
      context: CONTEXT,
    };

    try {
      let info = await transporter.sendMail(mailOptions);
      // console.log(info)
      return info;
    } catch (err) {
      return { message: "smtp-error", err };
    }
  }
}
