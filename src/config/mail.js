import nodemailer from "nodemailer";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.resolve(
  __dirname,
  "..",
  "template",
  "verificationEmailTemplate.html"
);

const templateReplyContactPath = path.resolve(
  __dirname,
  "..",
  "template",
  "replyContactEmailTemplate.html"
);

const emailTemplate = fs.readFileSync(templatePath, "utf8");
const emailTemplateReplyContact = fs.readFileSync(
  templateReplyContactPath,
  "utf8"
);

const compiledTemplateReplyContact = handlebars.compile(
  emailTemplateReplyContact
);
const compiledTemplate = handlebars.compile(emailTemplate);

export const sendEmail = ({
  email,
  name,
  verificationCode,
  type = "verify",
  content,
  subject = "Xác thực OTP",
  template = "verify-otp",
}) => {
  let htmlContent = null;
  switch (type) {
    case "verify":
      htmlContent = compiledTemplate({
        name: name,
        verificationCode: verificationCode,
      });
      break;
    case "replyContact":
      htmlContent = compiledTemplateReplyContact({
        name,
        content,
      });
      break;
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mainOptions = {
    from: "The-gioi-den",
    to: email,
    subject,
    template,
    html: htmlContent,
  };

  transporter.sendMail(mainOptions, function (err, info) {
    if (err) {
      console.log("Error while sending email: ", err);
    }
  });
};
