
import express from "express";

import { getSignUpPage, getLoginPage, postSignUp, postLogin, verifyOTP, resendOTP, logout,googleAuth,googleCallback,logoutUser,authStatus } from "../controllers/authController.js";
import  isAuthenticated  from "../middleware/auth.js"
 
import { getHomePage,getAllGames } from "../controllers/userController.js";
const router = express.Router();


// Existing routes

router.get("/signup", getSignUpPage);
router.post("/signup", postSignUp);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

router.get("/login", getLoginPage);
router.post("/login", postLogin);
router.get('/logout', logout);

router.get('/auth/google', googleAuth); 
router.get('/auth/google/callback', googleCallback); 
router.get('/logout', logoutUser); 
router.get('/status', authStatus);

router.get('/home',isAuthenticated,getHomePage);
router.get('/allgames',isAuthenticated,getAllGames);

export default router;