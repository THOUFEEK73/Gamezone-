import User from "../models/userModel.js";
import dotenv from "dotenv";
import { hashPassword,comparePassword } from "../utils/hash.js";
import sendEmail from "../utils/mailer.js";
import crypto from "crypto"; // Add this import
import OTP from "../models/otpModel.js";
import { generateOTP } from "../utils/otp-functions.js";

dotenv.config();

export const getSignUpPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  res.render("user/signup", { err: null });
};

export const getLoginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  return res.render("user/login", { err: null });
};


export const logout =(req,res)=>{
  req.session.destroy((err) =>{
    if(err){
      console.error('Error destroying session:',err);
      return res.status(500).json({message:"Error destroying session"});
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  })
}

export const postSignUp = async (req, res) => {
  try {
    const { name, email, phone, password, confirm_password } = req.body;

    // Check if all fields are filled
    if (!name || !email || !phone || !password || !confirm_password) {
      return res.render("user/signup", { err: "Please Fill All The Fields" });
    }

    // Check if passwords match
    if (password !== confirm_password) {
      return res.render('user/signup', { err: 'Passwords do not match' });
    }

    // Password validation: at least 8 characters
    if (password.length < 8) {
      return res.render('user/signup', { err: 'Password must be at least 8 characters long' });
    }

    // Optional: Additional password criteria (e.g., one number, one uppercase letter)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.render('user/signup', {
        err: 'Password must be at least 8 characters long, contain at least one uppercase letter and one number'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user/signup", { err: "User already exists" });
    }

    // Hash the password before saving to the session
    const hashedPassword = await hashPassword(password);

    // Save temporary user data in session
    req.session.tempUser = { 
      name, 
      phone, 
      email, 
      password: hashedPassword,  // Save hashed password
      isVerified: true,
    };

    // Generate OTP and send it to the user
    const otpSent = await generateOTP(email);
    if (!otpSent) {
      return res.render("user/signup", { err: "Failed to send OTP" });
    }

    // Render OTP verification page
    res.render("user/verify-otp", { email });

  } catch (error) {
    console.error("Signup error:", error);
    res.render("user/signup", { err: "Something went wrong during registration" });
  }
};


// Verify OTP

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
    const fullOTP = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.render("user/verify-otp", {
        email,
        err: "OTP expired or not found. Please request a new OTP.",
      });
    }

    // Match the OTP
    if (otpRecord.otp !== fullOTP) {
      return res.render("user/verify-otp", {
        email,
        err: "Invalid OTP. Please try again.",
      });
    }

    // Get user data from session
    const tempUser = req.session.tempUser;
    if (!tempUser) {
      return res.render("user/verify-otp", {
        email,
        err: "Registration data not found. Please register again.",
      });
    }

    try {
      // Create new user
      const newUser = await User.create({
        name: tempUser.name,
        email: tempUser.email,
        phone: tempUser.phone,
        password: tempUser.password,
        isVerified: true
      });

      // Clear session data and OTP
      delete req.session.tempUser;
      await OTP.deleteOne({ email });

      // Set session for authenticated user
      req.session.userId = newUser._id;
      req.session.user = {
        name: newUser.name,
        email: newUser.email
      };

      // Redirect to home page
      return res.redirect('/home');
    } catch (error) {
      console.error('User creation error:', error);
      return res.render("user/verify-otp", {
        email,
        err: "Failed to create user account. Please try again.",
      });
    }
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.render("user/verify-otp", {
      email: req.body.email,
      err: "Server error. Please try again.",
    });
  }
};

// Add resend OTP functionality
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Delete existing OTP if any
    await OTP.deleteOne({ email });

    // Generate and send new OTP
    const otpSent = await generateOTP(email);

    if (!otpSent) {
      return res.status(500).json({
        message: "Failed to send OTP. Please try again."
      });
    }

    return res.status(200).json({
      message: "OTP has been resent to your email."
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
};


export const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
      return res.render("user/login", {
        err: "Email and Password are required",
      });
    }

    // Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("user/login", { err: "User not found!" });
    }

    // Compare the hashed password with the entered password
    const isPasswordValid = await comparePassword(password, user.password); 
    if (!isPasswordValid) {
      return res.render("user/login", { err: "Invalid Credentials" });
    }

    // If passwords match, set session data
    req.session.userId = user._id;
    req.session.user = {
      name: user.name,
      email: user.email,
    };

    // Save the session and redirect
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.render("user/login", {
          err: "Server error. Please try again",
        });
      }
      return res.redirect("/home");
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.render("user/login", { err: "Server error. Please try again" });
  }
};


