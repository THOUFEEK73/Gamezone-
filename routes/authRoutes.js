
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
    postAddCart,
    removeCart,
    updateQuantity,
    getCheckoutPage,
    postPlaceCODOrder,
    getOrderSuccessPage,
    getOrderDetailPage,
    getViewOrderPage,
    postCancelStatus,
    postReturnStatus,
    toggleWishlist


    
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

router.get('/home',noCache,isAuthenticated,getHomePage);
router.get('/search',homePageSearch);
router.get('/allsearch',allGameSearch); 


router.get('/profile',noCache,isAuthenticated,getProfilePage);
router.post('/edit-profile',postEditProfile)
router.post('/send-verification-code',sendVerificationCode);
router.post('/verify-email', postVerifyEmail);
router.get('/address',noCache,isAuthenticated,getAddressPage)
router.post('/post-address',postAddress);

router.get('/location',getLocationByPinCode)
router.post('/deleteAddress/:id',deleteAddress);
router.post('/setDefaultAddress/:id',postSetDefault)
router.post('/editAddress/:id',postEditAddress)

// router.get('/forgot-password',getforgorPassword)


// wishList 

router.get('/wishlist',noCache,isAuthenticated,getWishListPage);
// routes/user.js
router.post('/wishlist/toggle', toggleWishlist);



router.get('/cart',noCache,isAuthenticated,getCartPage)
router.get('/orderDetails',noCache,isAuthenticated,getOrderDetailPage)

router.post('/cart/add',postAddCart)
router.delete('/cart/remove/:id',removeCart)
router.put('/cart/update-Quantity',updateQuantity)






// router.get('/proceedTocheckout',isAuthenticated,proceedToCheckout )
router.get('/checkout',noCache,isAuthenticated,getCheckoutPage)

router.post('/placeOrder',postPlaceCODOrder)

router.get('/orderSuccess',getOrderSuccessPage)

router.get('/viewOrder/:id',getViewOrderPage)

router.post('/return-item',postReturnStatus)
router.post('/cancel-item',postCancelStatus)




router.get('/allgames',noCache,isAuthenticated,showAllGames)
router.get('/gamedetail/:id',noCache,isAuthenticated,getDetailPage);
router.post('/filter-games',filterGames)


export default router;