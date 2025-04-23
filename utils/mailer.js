import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();


const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID ,
    pass: process.env.PASSWORD,
  },
});

 const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: "thoufeeknazeerpunalur@gmail.com",
    to,
    subject,
    text,
  };
  try {
    await transport.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Email sending Failed:", err);
    return;
  }
};


export default sendEmail