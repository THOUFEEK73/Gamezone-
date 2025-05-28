import crypto from "crypto";
import OTP from "../models/otpModel.js";
import sendEmail  from "./mailer.js"; // Adjust path as needed

export const generateOTP = async (email) => {
  try {
     
     if(!email || typeof email !== 'string'){
         throw new error('Invalid email');
     } 
     
    const generateotp = crypto.randomInt(100000, 999999).toString();

    // Delete existing OTP if any
    await OTP.deleteOne({ email });

    const otp = new OTP({ email, otp: generateotp });
    await otp.save();

    const emailSent = await sendEmail(
      email,
      "Email Verification OTP",
      `Your OTP for verification is: ${generateotp}`
    );

    return emailSent;
  } catch (error) {
    console.error("OTP generation error:", error);
    return false;
  }
};
