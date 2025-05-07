
import express from "express";

import { getSignUpPage, getLoginPage, postSignUp,
     postLogin, forgotPasswordPage,postForgotPassword,
     verifyOTP, resendOTP, logout,
     googleAuth,googleCallback,
     logoutUser,authStatus,getResetPassworPage,
     postResetPassword 
    } from "../controllers/authController.js";
import  isAuthenticated  from "../middleware/auth.js"
 
import { getHomePage,homePageSearch,allGameSearch } from "../controllers/userController.js";
import {getDetailPage} from '../controllers/gameDetail.js'
import { showAllGames } from "../controllers/AllGamesController.js";
import  filterGames  from "../controllers/filterGamesController.js";
import  noCache  from '../middleware/Cache-Control.js'
const router = express.Router();


// Existing routes

router.get("/signup",noCache, getSignUpPage);
router.post("/signup",noCache, postSignUp);
router.post('/verify-otp',noCache, verifyOTP);
router.post('/resend-otp',noCache, resendOTP);
router.get('/forgot-password',noCache,forgotPasswordPage)
router.post('/forgot-password',noCache,postForgotPassword)
router.get('/reset-password/:token',noCache,getResetPassworPage)
router.post('/reset-password',noCache,postResetPassword)

router.get("/login",noCache, getLoginPage);
router.post("/login",noCache, postLogin);
router.get('/logout',noCache, logout);

router.get('/auth/google', googleAuth); 
router.get('/auth/google/callback', googleCallback); 
router.get('/logout', logoutUser); 
router.get('/status', authStatus);

router.get('/home',isAuthenticated,getHomePage);
router.get('/search',homePageSearch);
router.get('/allsearch',allGameSearch);




router.get('/allgames',isAuthenticated,showAllGames)
router.get('/gamedetail/:id',isAuthenticated,getDetailPage);
router.post('/filter-games',isAuthenticated,filterGames)


export default router;