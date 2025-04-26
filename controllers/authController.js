import User from "../models/userModel.js";
import dotenv from "dotenv";
import { hashPassword, comparePassword } from "../utils/hash.js";
import passport from '../config/passport.js';
import OTP from "../models/otpModel.js";
import { generateOTP } from "../utils/otp-functions.js";

dotenv.config();

// Get Signup Page
export const getSignUpPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  const error = req.session.signupError || null;
  const formData = req.session.formData || {};
  req.session.signupError = null;
  req.session.formData = null;
  return res.render("user/signup", { err: error, formData });
};

// Get Login Page
export const getLoginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  const error = req.session.loginError || null;
  req.session.loginError = null;
  return res.render("user/login", { err: error });
};

// Logout User
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: "Error destroying session" });
    }
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
};

// Post Signup
export const postSignUp = async (req, res) => {
  try {
    const { name, email, phone, password, confirm_password } = req.body;
    req.session.formData = { name, email, phone };

    if (!name || !email || !phone || !password || !confirm_password) {
      req.session.signupError = 'All fields are required';
      return res.redirect('/signup');
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      req.session.signupError = 'Phone number must be exactly 10 digits';
      return res.redirect('/signup');
    }

    if (password !== confirm_password) {
      req.session.signupError = 'Passwords do not match';
      return res.redirect('/signup');
    }

    if (password.length < 8) {
      req.session.signupError = 'Password must be at least 8 characters long';
      return res.redirect('/signup');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      req.session.signupError = 'Password must contain at least one uppercase letter and one number';
      return res.redirect('/signup');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.session.signupError = "User already exists";
      return res.redirect('/signup');
    }

    const hashedPassword = await hashPassword(password);

    req.session.tempUser = {
      name,
      phone,
      email,
      password: hashedPassword,
      isVerified: false,
    };

    const otpSent = await generateOTP(email);
    if (!otpSent) {
      return res.render("user/signup", { err: "Failed to send OTP" });
    }

   return res.render("user/verify-otp", { email });

  } catch (error) {
    console.error("Signup error:", error);
   return res.render("user/signup", { err: "Something went wrong during registration" });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
    const fullOTP = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.render("user/verify-otp", {
        email,
        err: "OTP expired or not found. Please request a new OTP."
      });
    }

    if (otpRecord.otp !== fullOTP) {
      return res.render("user/verify-otp", {
        email,
        err: "Invalid OTP. Please try again."
      });
    }

    const tempUser = req.session.tempUser;
    if (!tempUser) {
      return res.render("user/verify-otp", {
        email,
        err: "Registration data not found. Please register again."
      });
    }

    const newUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      isVerified: true
    });

    delete req.session.tempUser;
    await OTP.deleteOne({ email });

    req.session.userId = newUser._id;
    req.session.user = {
      name: newUser.name,
      email: newUser.email,
    };

    res.redirect('/home');

  } catch (error) {
    console.error("OTP verification error:", error);
    return res.render("user/verify-otp", {
      email: req.body.email,
      err: "Server error. Please try again."
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    await OTP.deleteOne({ email });

    const otpSent = await generateOTP(email);

    if (!otpSent) {
      return res.status(500).json({ message: "Failed to resend OTP. Please try again." });
    }

   return res.status(200).json({ message: "OTP has been resent to your email." });

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Post Login
export const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.loginError = "Email and password are required";
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.session.loginError = "User not found";
      return res.redirect('/login');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      req.session.loginError = "Password does not match";
      return res.redirect('/login');
    }
    
    if(!user.isVerified){
      req.session.loginError = 'Your account has been blocked please contact us ';
      return res.redirect('/login');
    }
   
    req.session.userId = user._id;
    req.session.user = {
      name: user.name,
      email: user.email,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        req.session.loginError = "Server error. Please try again.";
        return res.redirect('/login');
      }
     return res.redirect("/home");
    });

  } catch (error) {
    console.error("Login error:", error);
  return  res.render("user/login", { err: "Server error. Please try again" });
  }
};


// Google Auth Trigger
export const googleAuth = (req, res, next) => {
  try {
  
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      accessType: 'offline'
    })(req, res, next);
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.redirect('/login?error=auth_failed');
  }
};

// Google Callback
export const googleCallback = (req, res, next) => {
    console.log('Google Callback triggered');

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }, async (err, user, info) => {
        if (err) {
            console.error('Auth error:', err);
            return res.redirect('/login?error=auth_error');
        }

        if (!user) {
            console.log('User not found during Google callback');
            return res.redirect('/login?error=auth_failed');
        }

        // Check if user is blocked
        if (!user.isVerified) {
            return res.redirect('/login?error=account_blocked');
        }

    req.logIn(user, async (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.redirect('/login?error=login_failed');
      }

      try {
        console.log('User before session save:', user);
        req.session.userId = user._id;
        req.session.user = {
          name: user.name,
          email: user.email,
        };
      

        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            resolve();
          });
        });

        // In your successful authentication handlers (postLogin, verifyOTP, googleCallback)
        // Add this header before redirecting
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
       return res.redirect('/home');

      } catch (error) {
        console.error('Session save error:', error);
        res.redirect('/login?error=session_error');
      }
    });

  })(req, res, next);
};

// Logout (Passport)
export const logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/');
    }
   return res.redirect('/');
  });
};

// Check Auth Status
export const authStatus = (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar
    } : null
  });
};
