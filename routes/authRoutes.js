import express from "express";
import { 
    getSignUpPage, 
    getLoginPage, 
    postSignUp,
    postLogin, 
    forgotPasswordPage,
    postForgotPassword,
    verifyOTP, 
    resendOTP, 
    logout,
    googleAuth,
    googleCallback,
    logoutUser,
    authStatus,
    getResetPassworPage,
    postResetPassword 
} from "../controllers/authController.js";

import { 
    getHomePage,
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
    // getCartPartial,
    getCheckoutPage,
    postPlaceCODOrder,
    getOrderSuccessPage,
    createRazorpayOrder,
    verifyRazorpayPayment,
    retryRezorpayPayment,
    clearCart,
    getPaymentFailedPage,
    getOrderDetailPage,
    getViewOrderPage,
    postCancelStatus,
    postSubscribeEmail,
    postUnsubscribe,
    postReturnStatus,
    toggleWishlist,
    removeWishlist,
    getChangePasswordPage,
    postPasswordChange,
    postApplyCoupon,
    postPlaceWalletOrder
    
} from "../controllers/userController.js";

import {getWalletPage} from "../controllers/userWalletController.js";

import isAuthenticated from "../middleware/auth.js";
import noCache from '../middleware/Cache-Control.js';
import generateInvoice from "../utils/generateInvoice.js";
import getLocationByPinCode from '../controllers/locationController.js';
import { getDetailPage } from '../controllers/gameDetail.js';
import { showAllGames } from "../controllers/AllGamesController.js";
import filterGames from "../controllers/filterGamesController.js";

import Order from '../models/orderModel.js';


const router = express.Router();

// Auth Routes
router.get("/signup", noCache, getSignUpPage);
router.post("/signup", noCache, postSignUp);
router.post('/verify-otp', noCache, verifyOTP);
router.post('/resend-otp', noCache, resendOTP);
router.get('/forgot-password', noCache, forgotPasswordPage);
router.post('/forgot-password', noCache, postForgotPassword);
router.get('/reset-password/:token', noCache, getResetPassworPage);
router.post('/reset-password', noCache, postResetPassword);

// Login/Logout Routes
router.get("/login", noCache, getLoginPage);
router.post("/login", noCache, postLogin);
router.get('/logout', noCache, logout);

// Google Auth Routes
router.get('/auth/google', googleAuth);
router.get('/auth/google/callback', googleCallback);
router.get('/status', authStatus);

// User Profile Routes
router.get('/home', noCache, isAuthenticated, getHomePage);
router.get('/profile', noCache, isAuthenticated, getProfilePage);
router.post('/edit-profile', postEditProfile);
router.get('/password-change', isAuthenticated, getChangePasswordPage);
router.post('/password-change', isAuthenticated, postPasswordChange);

// Email Verification Routes
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-email', postVerifyEmail);

// Address Management Routes
router.get('/address', noCache, isAuthenticated, getAddressPage);
router.post('/post-address', postAddress);
router.get('/location', getLocationByPinCode);
router.post('/deleteAddress/:id', deleteAddress);
router.post('/setDefaultAddress/:id', postSetDefault);
router.post('/editAddress/:id', postEditAddress);

// Wishlist Routes
router.get('/wishlist', noCache, isAuthenticated, getWishListPage);
router.post('/wishlist/toggle', toggleWishlist);
router.delete('/wishlist/remove/:id', removeWishlist);

// Cart Routes
router.get('/cart', noCache, isAuthenticated, getCartPage);
router.post('/cart/add', postAddCart);
router.delete('/cart/remove/:id', removeCart);
router.put('/cart/update-Quantity', updateQuantity);
// router.get('/cart/partial',getCartPartial)

// Order Routes
router.get('/orderDetails', noCache, isAuthenticated, getOrderDetailPage);
router.get('/checkout', noCache, isAuthenticated, getCheckoutPage);
router.post('/placeOrder', postPlaceCODOrder);
router.post('/placeOrder/razorpay',createRazorpayOrder);
router.post('/verify/razorpay', verifyRazorpayPayment);
router.post('/razorpay/webhook', express.json(), async (req, res) => {
    const event = req.body;
    if (event.event === 'payment.failed') {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const order = await Order.findOne({ razorpayOrderId });
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
      }
    }
    res.status(200).send('OK');
  });
router.post('/retry-payment/:orderId',isAuthenticated,retryRezorpayPayment);
router.delete('/cart/clear',clearCart);
router.get('/payments-failed',getPaymentFailedPage);
router.post('/placeOrder/wallet',postPlaceWalletOrder)
router.get('/orderSuccess', getOrderSuccessPage);
router.get('/viewOrder/:id', getViewOrderPage);
router.post('/return-item', postReturnStatus);
router.post('/cancel-item', postCancelStatus);
router.get('/download-invoice/:orderId', generateInvoice);

// Search Routes
router.get('/search', homePageSearch);
router.get('/allsearch', allGameSearch);

// Game Routes
router.get('/allgames', noCache, isAuthenticated, showAllGames);
router.get('/gamedetail/:id', noCache, isAuthenticated, getDetailPage);
router.post('/filter-games', filterGames);

// Coupons

router.post('/apply-coupon',postApplyCoupon);



// User Wallet

router.get('/wallet', noCache, isAuthenticated,getWalletPage);

// User Subscribe
router.post('/subscribe',postSubscribeEmail)
router.post('/unsubscribe',postUnsubscribe)

export default router;