
import express from "express";

import { getSignUpPage, getLoginPage, postSignUp,
     postLogin, forgotPasswordPage,postForgotPassword,
     verifyOTP, resendOTP, logout,
     googleAuth,googleCallback,
     logoutUser,authStatus,getResetPassworPage,
     postResetPassword 
    } from "../controllers/authController.js";
import  isAuthenticated  from "../middleware/auth.js"
 
import { getHomePage,
    homePageSearch,
    allGameSearch,
    getProfilePage,
    getAddressPage,
    postEditProfile,
    postVerifyEmail,
    sendVerificationCode,
    postAddress,
    deleteAddress,
    postSetDefault,
    postEditAddress,
    getWishListPage,
    getCartPage,
    postAddCart
}
from "../controllers/userController.js";

import getLocationByPinCode from '../controllers/locationController.js'
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


router.get('/profile',getProfilePage);
router.post('/edit-profile',postEditProfile)
router.post('/send-verification-code',sendVerificationCode);
router.post('/verify-email', postVerifyEmail);
router.get('/address',getAddressPage)
router.post('/post-address',postAddress);

router.get('/location',getLocationByPinCode)
router.post('/deleteAddress/:id',deleteAddress);
router.post('/setDefaultAddress/:id',postSetDefault)
router.post('/editAddress/:id',postEditAddress)

// router.get('/forgot-password',getforgorPassword)

router.get('/wishlist',isAuthenticated,getWishListPage);
router.get('/cart',isAuthenticated,getCartPage)

router.post('/cart/add',postAddCart)




router.get('/allgames',isAuthenticated,showAllGames)
router.get('/gamedetail/:id',isAuthenticated,getDetailPage);
router.post('/filter-games',filterGames)


export default router;