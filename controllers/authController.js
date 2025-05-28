import User from "../models/userModel.js";
import dotenv from "dotenv";
import { hashPassword, comparePassword } from "../utils/hash.js";
import passport from '../config/passport.js';
import OTP from "../models/otpModel.js";
import { generateOTP } from "../utils/otp-functions.js";
import crypto from 'crypto';
import sendEmail from "../utils/mailer.js"; 
import flash from 'connect-flash';


dotenv.config();

// Get Signup Page
export const getSignUpPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  
   const formData = req.session.formData || {};

  const error = req.flash('error');
  
  return res.render("user/signup", { error,formData });
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
  req.session.userId = null;
  res.clearCookie('sessionId')
  return res.redirect('/login')
};

// Post Signup
export const postSignUp = async (req, res) => {
  try {
    const { name, email, phone, password, confirm_password } = req.body;
    req.session.formData = { name, email, phone };

    if(!name){
      req.flash('error','Name is required')
      return res.redirect('/signup')
    }

    
    if(!email){
      req.flash('error','Email is required');
      return res.redirect('/signup')
    }
    if(!phone){
      req.flash('error','please enter 10 digit valid phone number')
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      req.flash('error','Phone number must be exactly 10 digits');
      return res.redirect('/signup');
    }

    if(phone ==='0000000000'){
      req.flash('error','Phone number is not valide');
      return res.redirect('/signup');
    }

    if(phone === '1234567890'){
      req.flash('error','Phone number is not valide');
      return res.redirect('/signup');
    }

    if (password !== confirm_password) {
      req.flash('error','Passwords do not match');
      return res.redirect('/signup');
    }


    if (password.length < 8) {
       console.log('triggered')
       req.flash('error','Password must be at least 8 characters long');
      return res.redirect('/signup');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      req.flash('error','Password must contain at least one uppercase letter and one number');
      return res.redirect('/signup');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error',"User already exists");
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
   
     console.log(fullOTP)
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
   console.log('function triggered')
    const otpSent = await generateOTP(email);
    console.log('function triggered second')

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

export const forgotPasswordPage = (req,res)=>{
  if(req.session.userId){
    return res.redirect('/home');
  }
  const error = req.session.forgotPasswordError || null;
  req.session.forgotPasswordError = null;
  return res.render("user/forgot-password",{err:error});
}

export const postForgotPassword = async (req,res)=>{
  try{
    const email = req.body.email;
    console.log(email)
    const user = await User.findOne({email});
   
    if(!user){
      req.session.forgotPasswordError = 'User not found';
      return res.redirect('/forgot-password');

    }
    const token = crypto.randomBytes(32).toString('hex')
     user.resetPasswordToken =token;
     user.resetPasswordExpires = Date.now() + 1000 * 60 *10;
     await user.save();

     const resetLink = `http://localhost:3001/reset-password?token=${token}`;
     await sendEmail(user.email,'Reset Your Password',`Click the link to reset your password:${resetLink}`);
     res.status(200).render('user/reset-password',{token});

  }catch(error){
        console.error('Error in postForgotPassword:',{err:error});
        res.status(500).render('error', { err: ' Server Error please try after some time' });
  }
};

export const getResetPassworPage = async (req, res) => {
  const token = req.params.token; 
  console.log('Received token:', token);

  if (!token) {
    return res.status(400).render('error', { err: 'Invalid or expired token' });
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).render('error', { err: 'Invalid or expired token' });
  }

  const error = req.session.resetPasswordError || null;
  req.session.resetPasswordError = null;

  return res.render('user/reset-password', { token, err: error });
};


export const postResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // First check: Token presence
    if (!token) {
      return res.status(400).render('user/reset-password', {
        err: 'Invalid reset link. Please request a new password reset.',
        token
      });
    }

    // Second check: Required fields
    if (!password || !confirmPassword) {
      return res.status(400).render('user/reset-password', {
        err: 'Please fill in all password fields',
        token
      });
    }

    // Third check: Password length
    if (password.length < 8) {
      return res.status(400).render('user/reset-password', {
        err: 'Password must be at least 8 characters long',
        token
      });
    }

    // Fourth check: Password match
    if (password !== confirmPassword) {
      return res.status(400).render('user/reset-password', {
        err: 'Passwords do not match',
        token
      });
    }

    // Fifth check: Password requirements
    if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).render('user/reset-password', {
        err: 'Password must contain at least one uppercase letter and one number',
        token
      });
    }

    // Final check: Token validation
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).render('user/reset-password', {
        err: 'Password reset link has expired. Please request a new one.',
        token
      });
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).render('user/login', {
      success: 'Password reset successfully, please login'
    });

  } catch (error) {
    console.error('Error in postResetPassword:', error);
    return res.status(500).render('user/reset-password', {
      err: 'An error occurred while resetting your password. Please try again.',
      token: req.body.token
    });
  }
};


// Google Auth Trigger
export const googleAuth = (req, res, next) => {
  try {
    console.log('google auth triggered')
  
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      accessType: 'offline'
    })(req, res, next);
  } catch (error) {
    console.error('Google authentication error:');
    console.error('Google authentication error:', error);
    return res.redirect('/login?error=auth_failed');
  }
};

// Google Callback
export const googleCallback = (req, res, next) => {
    console.log('Google Callback triggered');

    passport.authenticate('google', { 
        failureRedirect: '/login', 
        failureFlash: true 
    }, async (err, user, info) => {
        if (err) {
            console.error('Auth error:', err);
            return res.redirect('/login?error=auth_error');
        }

        if (!user) {
            console.log('User not found during Google callback');
            return res.redirect('/login?error=auth_failed');
        }

        try {
            // Log in the user
            req.login(user, async (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.redirect('/login?error=login_failed');
                }

                // Set session variables
                req.session.userId = user._id;
                req.session.user = {
                    name: user.name,
                    email: user.email,
                };

                // Save session
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.redirect('/login?error=session_error');
                    }
                    
                    // Redirect to home page
                    return res.redirect('/home');
                });
            });
        } catch (error) {
            console.error('Session/login error:', error);
            return res.redirect('/login?error=session_error');
        }
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
