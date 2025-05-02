
import express from "express";

import { getSignUpPage, getLoginPage, postSignUp,
     postLogin, forgotPasswordPage,postForgotPassword,
     verifyOTP, resendOTP, logout,
     googleAuth,googleCallback,
     logoutUser,authStatus,getResetPassworPage,
     postResetPassword 
    } from "../controllers/authController.js";
import  isAuthenticated  from "../middleware/auth.js"
 
import { getHomePage } from "../controllers/userController.js";
import {getDetailPage} from '../controllers/gameDetail.js'
import { showAllGames } from "../controllers/AllGamesController.js";
import  filterGames  from "../controllers/filterGamesController.js";
const router = express.Router();


// Existing routes

router.get("/signup", getSignUpPage);
router.post("/signup", postSignUp);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/forgot-password',forgotPasswordPage)
router.post('/forgot-password',postForgotPassword)
router.get('/reset-password/:token',getResetPassworPage)
router.post('/reset-password',postResetPassword)

router.get("/login", getLoginPage);
router.post("/login", postLogin);
router.get('/logout', logout);

router.get('/auth/google', googleAuth); 
router.get('/auth/google/callback', googleCallback); 
router.get('/logout', logoutUser); 
router.get('/status', authStatus);

router.get('/home',isAuthenticated,getHomePage);




router.get('/allgames',isAuthenticated,showAllGames)
router.get('/gamedetail/:id',isAuthenticated,getDetailPage);
router.post('/filter-games',isAuthenticated,filterGames)


export default router;