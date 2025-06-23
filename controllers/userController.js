import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";
import User from "../models/userModel.js";
import { searchGames } from "../utils/searchFun.js";
import OTP from "../models/otpModel.js";
import { generateOTP } from "../utils/otp-functions.js";
import Address from "../models/addressModel.js";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import Wishlist from '../models/WishlistModel.js';
import bcrypt from "bcryptjs";
import {comparePassword,hashPassword} from "../utils/hash.js";
import Coupon from '../models/couponModel.js'
import Wallet from '../models/walletModel.js';
import Razorpay from 'razorpay';
import * as crypto from "crypto";
// import mongoose from 'mongoose';
import Subscriber from '../models/subscriberModel.js';
import sendEmail from '../utils/mailer.js';



import _ from "lodash";
import { response } from "express";
import { compareSync } from "bcryptjs";

// import { getSystemErrorMessage } from "util";
import { calculateDiscountedPrice,getActiveOffers } from "../utils/offerUtils.js";
import { unsubscribe } from "diagnostics_channel";



export const getHomePage = async (req, res) => {
  try {
    const userId = req.session.userId;
    // Check if user is authenticated
    if (!req.session.userId && !req.isAuthenticated()) {
      return res.redirect("/login");
    }

    // Set cache control headers
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // Fetch all games from the database
    const games = await Game.find({ status: "active" })
      .populate({ path: "category", match: { status: "active" } })
      .limit(10)
      .then((games) => games.filter((game) => game.category));



      const activeOffers = await getActiveOffers();

      const gamesWithOffers = games.map((game)=>{
        const gameObj = game.toObject();

        const productOffer = activeOffers.find(offer=>
          offer.offerType ==='product' && 
          offer.items.includes(game._id.toString()) && 
          offer.isActive
        )

        const categoryOffer = activeOffers.find(offer => 
          offer.offerType === 'category' && 
          offer.items.includes(game.category._id.toString()) &&
          offer.isActive
        );

       

        const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

     
      if(bestOffer){
        gameObj.originalPrice = gameObj.price;
        gameObj.discountPercentage = bestOffer.discountPercentage;
        gameObj.price = calculateDiscountedPrice(game.price,bestOffer.discountPercentage);
        gameObj.offerName = bestOffer.offerName;
      }
    
      return gameObj;
      
      })
   
    

    const cart = await Cart.findOne({ userId });

    let cartCount = 0;
    if (cart && cart.products.length > 0) {
      cartCount = cart.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    // Render the home page
    res.render("user/home", { games: gamesWithOffers, page: "home", cartCount });
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const homePageSearch = async (req, res) => {
  try {
    const query = req.query.query || "";
    const games = await searchGames(query);
    return res.json({ games, status: "active" });
  } catch (error) {
    console.error("Error handling search request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const allGameSearch = async (req, res) => {
  try {
    const query = req.query.query || "";

    const games = await searchGames(query);
    console.log("triggererd");
    return res.json(games);
  } catch (error) {
    console.error("Error handling search request:", error);
    console.error("Error handling search request:", error);
    res.status(500).render({ error: "Internal Server Error" });
  }
};

export const getProfilePage = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      // req.flash('error', 'You must be logged in to view your profile');
      return res.redirect("/login");
    }

    const user = await User.findById(userId);
    const messages = {
      success: req.flash("success"),
      error: req.flash("error"),
    };

    res.render("user/profile", { user, messages, page: "profile" });
  } catch (error) {
    console.error("Error rendering profile page:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getAddressPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/login");
    const address = await Address.find({ userId });
    res.render("user/address", { address, page: "address" });
  } catch (error) {
    console.error("Error fetching address page ", error);
    res.status(500).send("Internal Server Error");
  }
};

export const postEditProfile = async (req, res) => {
  try {

    console.log("function triggered");
    
    const userId = req.session.userId;
    const { name, phone } = req.body;
    const errors = {};


    if(!name || name.trim()===""){
       errors.name = "Please enter the Name";
    }

      if (!phone || !/^\d{10}$/.test(phone)) {
      errors.phone = "Phone must be 10 digits";
    }

   

    if(Object.keys(errors).length>0){
      return res.status(400).json({errors});
    }

       await User.findByIdAndUpdate(userId, { name, phone });
       console.log('function triggered 2');
       
             res.status(200).json({ message: "Profile updated successfully" });
    // await User.findByIdAndUpdate(userId, { name, phone }, { new: true });
    // req.flash("success", "Profile updated successfully");
    // res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash("error", "Failed to update profile");
    res.redirect("/profile");
  }
};

export const postVerifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const userId = req.session.userId;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord || otpRecord.otp !== verificationCode) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await User.findByIdAndUpdate(userId, { email });
    await OTP.deleteOne({ email });

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const sendVerificationCode = async (req, res) => {
  try {
    console.log("function triggered");
    const { email } = req.body;
    console.log(email);
    
    const userId = req.session.userId;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    await OTP.deleteOne({ email });

    const otpSent = await generateOTP(email);
    if (!otpSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP" });
    }

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const postAddress = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
   console.log('triggere');
   
    const {
      type,
      name,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault,
    } = req.body;
    
    const errors ={};
    if(!name || name.trim() === ""){
       errors.name = 'Please enter the Name';
    }

    if(!phone || !/^\d{10}$/.test(phone)){
      errors.phone = "phone must be 10 digits";
    }

    if(!street || street.trim() === ""){
      errors.street = "Please enter the street";
    }

    if(!city || city.trim() === ""){
      errors.city = "Please enter the city";
    }

    if(!state || state.trim() === ""){
      errors.state = "Please enter the state";
    }

    if(!zipCode || !/^\d{6}$/.test(zipCode)){
      errors.zipCode = "Zip code must be 6 digits";
    }

    if(!country || country.trim() === ""){
      errors.country = "Please enter the country";
    }

    if(Object.keys(errors).length>0){
      return res.status(400).json({errors});
    }

    if (isDefault === "true" || isDefault === true) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = new Address({
      userId,
      type,
      name,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: !!isDefault,
    });
    await newAddress.save();
    res.status(200).json({ message: "Address saved successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;
    if (!userId)
      return res.status(401).render("error", { message: "Unathorized" });
     await Address.deleteOne({ _id: addressId, userId });
   
     return res.redirect("/checkout")
    // if (result.deletedCount === 1) {
    //   return res.status(200).json({ message: "Address deleted" });
    // } else {
    //   return res.status(404).json({ error: "Address not found" });
    // }
  } catch (error) {
    console.error("Error deleting address", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

export const postEditAddress = async (req, res) => {
  const userId = req.session.userId;
  const addressId = req.params.id;
  console.log(addressId);

  const {
    type,
    name,
    phone,
    street,
    city,
    state,
    zipCode,
    country,
    isDefault,
  } = req.body;

  if (!userId) return res.status(401).render("error", { message });
  const errors ={};
    if(!name || name.trim() === ""){
       errors.name = 'Please enter the Name';
    }

    if(!phone || !/^\d{10}$/.test(phone)){
      errors.phone = "phone must be 10 digits";
    }

    if(!street || street.trim() === ""){
      errors.street = "Please enter the street";
    }

    if(!city || city.trim() === ""){
      errors.city = "Please enter the city";
    }

    if(!state || state.trim() === ""){
      errors.state = "Please enter the state";
    }

    if(!zipCode || !/^\d{6}$/.test(zipCode)){
      errors.zipCode = "Zip code must be 6 digits";
    }

    if(!country || country.trim() === ""){
      errors.country = "Please enter the country";
    }

    if(Object.keys(errors).length>0){
      return res.status(400).json({errors});
    }
  if (isDefault) {
  

    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }
  console.log("testing 2");

  await Address.findByIdAndUpdate(addressId, {
    type,
    name,
    phone,
    street,
    city,
    zipCode,
    state,
    country,
    isDefault: !!isDefault,
  });

  res.json({ success: true });
};

export const postSetDefault = async (req, res) => {

  const addressId = req.params.id;
  const userId = req.session.user._id;

  try {
    

    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });

    await Address.findByIdAndUpdate(addressId, { $set: { isDefault: true } });

    res.redirect("/address");
  } catch (error) {
    console.error("Error updating isDefault", error);
    res.status(500).render("error", { message: "server error" });
  }
};


export const getChangePasswordPage = (req,res)=>{
    try{
      res.render('user/password-change',{page:'passwordChange'});
    }catch(error){
      console.error('Error rendering change password page', error);
      res.status(500).render('error',{message:'Server is down please try after some times'});
    }
}

// controllers/userController.js
export const postPasswordChange = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const errors = {};

    if (!currentPassword) errors.currentPassword = 'Current password is required.';
    if (!newPassword) errors.newPassword = 'New password is required.';
    if (!confirmPassword) errors.confirmPassword = 'Confirm password is required.';
    if (newPassword && newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.';
    if (newPassword && confirmPassword && newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      return res.json({ success: false, errors, message: 'Please fix the errors below.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: 'User not found.' });

    const isMatch = await comparePassword(currentPassword, user.password);
    
    if (!isMatch) return res.json({ success: false, errors: { currentPassword: 'Current password is incorrect.' } });

   user.password = await hashPassword(newPassword);
    await user.save();

    // res.json({ success: true, message: 'Password updated successfully!' });
    req.session.destroy((err) => {
  if (err) {
    return res.json({ success: false, message: 'Password changed, but failed to log out. Please log out manually.' });
  }
  res.json({ success: true, message: 'Password updated successfully! Please log in again.', logout: true });
});
  } catch (error) {
    res.json({ success: false, message: 'Something went wrong.' });
  }
};


// controllers/userController.js
export const toggleWishlist = async (req, res) => {
try {
    const userId = req.session.userId;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    if (!Array.isArray(wishlist.products)) {
      wishlist.products = [];
    }

    const index = wishlist.products.findIndex(id => id.equals(productId));
    let action;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      action = 'removed';
    } else {
      wishlist.products.push(productId);
      action = 'added';
    }

    await wishlist.save();
    res.json({ success: true, action });
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};




// wish list

export const getWishListPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const wishlist = await Wishlist.findOne({ userId }).populate({
  path: 'products',
  populate: { path: 'category', model: 'Category' }
});

const cartItems = await Cart.findOne({ userId }).populate({
  path: "products.productId",
  populate: { path: "company", model: "GameCompany" },
});
    const wishlistItems = (wishlist?.products || []).map(game => ({
      _id: game._id,
      image: game.media.coverImage,
      name: game.title,
       category: game.category ? game.category.categoryName : '',
      price: game.discountPrice || game.price
    }));
    let cartCount = 0;

    if (cartItems && cartItems.products.length > 0) {
      cartCount = cartItems.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }
    res.render("user/wishlist", { page: "wishlist",wishlistItems,cartCount});
  } catch (error) {
    console.error("Error while rendering whishList", error);
    res
      .status(500)
      .render("error", { message: "server Error please Try after Some time" });
  }
};


export const removeWishlist = async (req,res)=>{
     try{
      const productId = req.params.id;
      const userId = req.session.userId;
      console.log(userId);

      await Wishlist.findOneAndUpdate({ userId },{$pull:{products:productId}},{new:true});

      res.status(200).json({success:true,message:'Product removed from wishlist'});
     }catch(error){
      console.error("Error while removing wishlist item", error);
      res.status(500).json({ success: false, message: "Server error" });  
     }
}


export const getCartPage = async (req, res) => {
  try {
    
    const userId = req.session.userId;
    const cartItems = await Cart.findOne({ userId }).populate({
      path: "products.productId",
      populate: { path: "company", model: "GameCompany" },
    });

    if (!cartItems) {
      return res.render("user/cart", {
        page: "cart",
        cart: null,
        cartCount: 0,
        subTotal: 0,
      });
    }

    const activeOffers = await getActiveOffers();


    let cartCount = 0;
    let subTotal = 0;
    let totalSavings = 0;
    let offerDiscount = 0;
    let total = 0;

    const productsWithOffers = cartItems.products.map(item => {
      const gameObj = item.productId.toObject();
      const itemObj = item.toObject();

      subTotal += gameObj.price * item.quantity;
      cartCount += item.quantity;
      // Find applicable offers
      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' && 
        offer.items.includes(gameObj._id.toString())
      );

      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' && 
        offer.items.includes(gameObj.category.toString())
      );

      // Get best offer
      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        itemObj.originalPrice = gameObj.price;
        itemObj.discountPercentage = bestOffer.discountPercentage;
        itemObj.price = Math.round(gameObj.price * (1 - bestOffer.discountPercentage / 100));
        itemObj.offerName = bestOffer.offerName;
        
        totalSavings += (gameObj.price - itemObj.price) * item.quantity;
      } else {
        itemObj.price = gameObj.price;
      }

  

      return itemObj;
    });
    // if (cartItems && cartItems.products.length > 0) {
    //   cartCount = cartItems.products.reduce(
    //     (total, item) => total + item.quantity,
    //     0
    //   );
    // }



    // cartItems.products.forEach((prd) => {
    //   const price = Number(prd.price);
    //   const quantity = Number(prd.quantity);

    //   subTotal += price * quantity;
    // });

    cartItems.products = productsWithOffers;
    
    total = Math.max(subTotal - totalSavings);
    res.render("user/cart", {
      page: "cart",
      cart: cartItems,
      cartCount,
      subTotal,
      total,
      totalSavings,
    });
  } catch (error) {
    console.error("Error while rendering cart", error);
    res
      .status(500)
      .render("error", { message: "server down please Try after Some times" });
  }
};

export const postAddCart = async (req, res) => {
  try {
  
    const { productId } = req.body;
    const userId = req.session.userId;

    let cart = await Cart.findOne({ userId });

    const game = await Game.findById(productId);

    // if(!game.stockQuantity <=0){
    //   return res.status(400).json({success:false,message:'Product is out of stock'})
    // }

    if (!cart) {
      cart = new Cart({
        userId,
        products: [
          {
            productId,
            quantity: 1,
            name: game.name,
            price: game.price,
          },
        ],
      });
    } else {
      const existingProduct = cart.products.find(
        (prd) => prd.productId.toString() === productId.toString()
      );
      if (existingProduct) {
        if(existingProduct.quantity >=game.stockQuantity){
          return res.status(400).json({
            success: false,
            message: `Cannot add more items. Maximum stock limit (${game.stockQuantity}) reached`
          });
        }
        existingProduct.quantity += 1;
        
      } else {
        cart.products.push({
          productId,
          quantity: 1,
          name: game.name,
          price: game.price,
        });
      }
    }

    await cart.save();
    const cartCount = cart.products.reduce((sum, item) => sum + item.quantity, 0);
    res.status(200).json({ message: "product added to cart",cartCount });
  } catch (error) {
    console.error("Error adding product to cart", error);
    res
      .status(500)
      .render("error", { message: "server error please try after someTimes" });
  }
};

export const removeCart = async (req, res) => {
  const itemId = req.params.id;
  const userId = req.session.userId;
  try {
    await Cart.updateOne({ userId }, { $pull: { products: { _id: itemId } } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error while removing Cart", error);
    res
      .status(500)
      .render("error", { message: "Server down please try after some times" });
  }
};


export const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { itemId, action, coupon } = req.body; // Accept coupon if sent

    const cart = await Cart.findOne({ userId }).populate('products.productId');
    const product = cart.products.id(itemId);
    const game = product.productId;
   
    const maxAllowed = game.stockQuantity;

    // Update quantity
    if (action === "increase" && product.quantity < maxAllowed) {
      product.quantity += 1;
    } else if (action === "decrease" && product.quantity > 1) {
      product.quantity -= 1;
    }

    await cart.save();
    const cartCount = cart.products.reduce((sum, item) => sum + item.quantity, 0);
    // Get all active offers
    const activeOffers = await getActiveOffers();

    // Recalculate all totals
    let subTotal = 0;
    let totalSavings = 0;
    let itemTotal = 0;
    let itemPrice = 0;

    // Prepare products with offers for coupon logic
    const productsWithOffers = cart.products.map(item => {
      const gameObj = item.productId.toObject ? item.productId.toObject() : item.productId;
      const itemObj = item.toObject();

      // Find best offer for this item
      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' && offer.items.includes(gameObj._id.toString())
      );
      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' && offer.items.includes(gameObj.category?.toString())
      );
      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        itemObj.originalPrice = gameObj.price;
        itemObj.discountPercentage = bestOffer.discountPercentage;
        itemObj.price = calculateDiscountedPrice(gameObj.price, bestOffer.discountPercentage);
        itemObj.offerName = bestOffer.offerName;
        const itemSavings = (gameObj.price - itemObj.price) * item.quantity;
        totalSavings += itemSavings;
      } else {
        itemObj.price = gameObj.price;
      }

      subTotal += gameObj.price * item.quantity;

      // For the updated item, set itemTotal and itemPrice
      if (item._id.toString() === itemId) {
        itemTotal = itemObj.price * item.quantity;
        itemPrice = itemObj.price;
      }

      return itemObj;
    });

    // Coupon logic (optional, if you want to support coupon in cart)
    let couponDiscount = 0;
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon, isActive: true, isExpired: false });
      if (couponDoc && (subTotal - totalSavings) >= couponDoc.minOrderAmount) {
        if (couponDoc.discountType === 'percentage') {
          couponDiscount = Math.floor((subTotal - totalSavings) * (couponDoc.discountValue / 100));
        } else {
          couponDiscount = couponDoc.discountValue;
        }
      }
    }

    let total = Math.max(subTotal - totalSavings - couponDiscount, 0);

    // Delivery charge logic (same as checkout)
    const DELIVERY_CHARGE = 100;
    let deliveryCharge = 0;
    if (subTotal < 1000) {
      deliveryCharge = DELIVERY_CHARGE;
    }
   
    const grandTotal = total + deliveryCharge;
   
    res.json({
      success: true,
      updateQty: product.quantity,
      itemId,
      itemPrice,
      itemTotal,
      subTotal,
      totalSavings,
      couponDiscount,
      cartCount,
      deliveryCharge,
      grandTotal,
      stockQuantity:game.stockQuantity,
    });

  } catch (error) {
    console.error("Error updating the product quantity", error);
    res.status(500).render("error", {
      message: "Server down, please try after some time.",
    });
  }
};

// export const updateQuantity = async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { itemId, action } = req.body;

//     const cart = await Cart.findOne({ userId }).populate('products.productId') 

//     const product = cart.products.id(itemId);

//     const game = product.productId;

//     const maxAllowed  = game.stockQuantity;

//     if (action === "increase") {
//       if(product.quantity < maxAllowed){
        
//           product.quantity += 1;
//       }
     
//     } else if (action === "decrease" && product.quantity > 1) {
//       product.quantity -= 1;
//     }

//     const itemTotal = game.price * product.quantity

//     console.log('total quantity of aproduct',product.quantity);
//     console.log("cart total price", cart.totalPrice);
//     console.log('game price is ',game.price)

//     await cart.save();
//     res.json({ success: true,
//     updateQty:product.quantity,
//     itemId,
//     itemPrice:game.price,
//     subTotal:cart.totalPrice,
//    });
//   } catch (error) {
//     console.error("Error updating the product quantity", error);
//     res
//       .status(500)
//       .render("error", { message: "Server down please try after some times" });
//   }
// };

export const proceedToCheckout = (req, res) => {
  console.log("yes....");
  req.session.canAccessCheckout = true;
  res.redirect("/checkout");
};

export const getCheckoutPage = async (req, res) => {
  try {
    // if(!req.session.canAccessCheckout){
    //   console.log('triggering......')
    //   return res.redirect('/cart');
    // }

    const appliedCoupon = req.query.coupon || null;

    console.log("applied coupon is ", appliedCoupon);

    req.session.canAccessCheckout = false;

    const userId = req.session.userId;
    const cartItems = await Cart.findOne({ userId }).populate({
      path: "products.productId",
      populate: { path: "company", model: "GameCompany" },
    });
    const wallet = await Wallet.findOne({ userId }).lean();
    const address = await Address.find({ userId });
    const coupons = await Coupon.find({ isActive: true, isExpired: false }).sort({ createdAt: -1 });

    if (!cartItems || cartItems.products.length === 0) {
      return res.redirect("/cart");
    }

    const activeOffers = await getActiveOffers();

  
    let cartCount = 0;
    let subTotal = 0;
    let totalSavings = 0;
    let total = 0;

    const productsWithOffers = cartItems.products.map((item)=>{
          const gameObj =item.productId.toObject();
          const itemObj = item.toObject();


          const productOffer = activeOffers.find(offer =>
            offer.offerType === 'product' && 
            offer.items.includes(gameObj._id.toString())
          );
    
          const categoryOffer = activeOffers.find(offer =>
            offer.offerType === 'category' && 
            offer.items.includes(gameObj.category._id.toString())
          );

          const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

        if (bestOffer) {
          itemObj.originalPrice = gameObj.price;
          itemObj.discountPercentage = bestOffer.discountPercentage;
          itemObj.price = calculateDiscountedPrice(gameObj.price, bestOffer.discountPercentage);
          itemObj.offerName = bestOffer.offerName;
          const itemSavings = (gameObj.price - itemObj.price) * item.quantity;
          totalSavings += itemSavings;
        }

        subTotal += gameObj.price * item.quantity;
        cartCount +=item.quantity;

       
        return itemObj;
    
    })

    cartItems.products = productsWithOffers;
    

    if (cartItems && cartItems.products.length > 0) {
      cartCount = cartItems.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    let couponDiscount = 0
    let appliedCouponDoc = null;

    if (appliedCoupon) {
      appliedCouponDoc = await Coupon.findOne({ code: appliedCoupon, isActive: true, isExpired: false });
      if (appliedCouponDoc && (subTotal - totalSavings) >= appliedCouponDoc.minOrderAmount) {
        if (appliedCouponDoc.discountType === 'percentage') {
          couponDiscount = Math.floor((subTotal - totalSavings) * (appliedCouponDoc.discountValue / 100));
        } else {
          couponDiscount = appliedCouponDoc.discountValue;
        }
      }
    }

     total = Math.max(subTotal - totalSavings - couponDiscount,0);
// total = Math.max(subTotal - totalSavings, 0);
    // cartItems.products.forEach((prd) => {
    //   subTotal = prd.price * prd.quantity;
    // });

    const DELIVERY_CHARGE = 100;
    let deliveryCharge = 0;

    if(subTotal< 1000){
      deliveryCharge = DELIVERY_CHARGE
    
    }

    const grandTotal = total + deliveryCharge;
    const usedCoupons = await Coupon.find({ usedBy: userId }).select('code -_id');
const usedCouponCodes = usedCoupons.map(c => c.code);
const availableCoupons = coupons.filter(coupon => !usedCouponCodes.includes(coupon.code));
    res.render("user/checkout", {
      page: "checkout",
      cartCount,
      cart: cartItems,
      subTotal,
      address,
      totalSavings,
      total,
      grandTotal,
      deliveryCharge,
      appliedCoupon,
      couponDiscount,
      coupons:availableCoupons,
      wallet,
      usedCouponCodes
    });
  } catch (error) {
    console.error("Error while fetching checkout Page", error);
    res
      .status(500)
      .render("error", { message: "server down please try after some times" });
  }
};

// place order

export const postPlaceCODOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { shippingAddress, coupon } = req.body;

    console.log('placed cod order with coupon code',coupon);

    const cartItems = await Cart.findOne({ userId }).populate("products.productId");
    if (!cartItems || cartItems.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }


    const activeOffers = await getActiveOffers();
    let subTotal = 0;
    let totalSavings = 0;
    let offerDiscount = 0;
    const productsWithOffers = cartItems.products.map(item => {
      const gameObj = item.productId.toObject();
      const itemObj = item.toObject();

  
      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' &&
        offer.items.includes(gameObj._id.toString())
      );
      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' &&
        offer.items.includes(gameObj.category._id.toString())
      );


      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        itemObj.originalPrice = gameObj.price;
        itemObj.discountPercentage = bestOffer.discountPercentage;
        itemObj.price = calculateDiscountedPrice(gameObj.price, bestOffer.discountPercentage);
        itemObj.offerName = bestOffer.offerName;
        const itemSavings = (gameObj.price - itemObj.price) * item.quantity;
        totalSavings += itemSavings;
        offerDiscount +=itemSavings;
        
      } else {
        itemObj.price = gameObj.price;
      }
      subTotal += itemObj.price * item.quantity;
      return itemObj;
    });

    // Coupon logic
    let discount = 0;
 
    let appliedCoupon = null;
    let couponDescription = '';
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon, isActive: true,isExpired:false});
     
      if(couponDoc.usedBy && couponDoc.usedBy.includes(userId)){
        return res.status(400).json({ success: false, message: 'You have already used this coupon.' });
      }

      if (couponDoc && subTotal >= couponDoc.minOrderAmount) {
        if (couponDoc.discountType === 'percentage') {
          discount = Math.floor(subTotal * (couponDoc.discountValue / 100));
        } else {
          discount = couponDoc.discountValue;
        }
        appliedCoupon = couponDoc.code;
        couponDescription = couponDoc.description || '';
      }
    }

    if(appliedCoupon){
       await Coupon.findOneAndUpdate({code:appliedCoupon},{$addToSet:{usedBy:userId}},{new:true});
    }

    const totalAmount = Math.max(subTotal - discount, 0);

    const DELIVERY_CHARGE = 100;
    let deliveryCharge = 0;
    if(totalAmount < 1000){
      deliveryCharge = DELIVERY_CHARGE;
    }

    const grandTotal = totalAmount + deliveryCharge;

    console.log('This is the grand total',grandTotal);

    // Reduce stock
    for (const item of productsWithOffers) {
      const game = await Game.findById(item.productId);
      if (!game || game.stockQuantity < item.quantity) {
        return res.status(400).render('error', { message: `Not enough stock for ${game ? game.title : 'a product'}` });
      }
      game.stockQuantity -= item.quantity;
      await game.save();
    }

    // Generate orderId
    function generateOrderId(userId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      const day = String(now.getDate()).padStart(2, '0');
      const shortUserId = userId.toString().slice(-4).toUpperCase();
      const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `ORD-${year}${month}${day}-${randomStr}-${shortUserId}`;
    }
    const orderId = generateOrderId(userId);

    // --- FIX: Do NOT group, just map all items ---
    const orderItems = productsWithOffers.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      productTitle: item.productTitle || item.name || '',
      discountedPrice: item.price,
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      offerName: item.offerName,
      offerDiscount: item.originalPrice && item.price
    ? (item.originalPrice - item.price) * item.quantity
    : 0,
      status: 'Pending',
    }));
    const totalOfferDiscount = orderItems.reduce((sum, item) => sum + (item.offerDiscount || 0), 0);
    // Create order
    const order = new Order({
      userId: userId,
      items: orderItems,
      paymentMethod: "cod",
      totalAmount,
      coupon: appliedCoupon,
      orderId: orderId,
      discount,
      deliveryCharge,
      grandTotal,
      offerDiscount:totalOfferDiscount,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      }
    });
    await order.save();

    // Clear cart
    await Cart.findOneAndDelete({ userId: userId });

    res.redirect("/orderSuccess");
  } catch (error) {
    console.error("Error while ordering the product", error);
    res
      .status(500)
      .render("error", {
        message: "server is down please try after some times",
      });
  }
};


export const createRazorpayOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress, coupon } = req.body;
    const userId = req.session.userId;

    // 1. Get cart and offers
    const cartItems = await Cart.findOne({ userId }).populate("products.productId");
    if (!cartItems || cartItems.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    const activeOffers = await getActiveOffers();

    // 2. Calculate totals and apply offers
    let subTotal = 0;
    let totalSavings = 0;
    let offerDiscount = 0;
    const productsWithOffers = cartItems.products.map(item => {
      const gameObj = item.productId.toObject();
      const itemObj = item.toObject();

      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' && offer.items.includes(gameObj._id.toString())
      );
      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' && offer.items.includes(gameObj.category?.toString())
      );
      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        itemObj.originalPrice = gameObj.price;
        itemObj.discountPercentage = bestOffer.discountPercentage;
        itemObj.price = calculateDiscountedPrice(gameObj.price, bestOffer.discountPercentage);
        itemObj.offerName = bestOffer.offerName;
        const itemSavings = (gameObj.price - itemObj.price) * item.quantity;
        totalSavings += itemSavings;
        offerDiscount += itemSavings;
      } else {
        itemObj.price = gameObj.price;
      }
      subTotal += itemObj.price * item.quantity;
      return itemObj;
    });

    // 3. Coupon logic
    let discount = 0;
    let appliedCoupon = null;
    let couponDescription = '';
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon, isActive: true,isExpired:false });
      if (couponDoc && subTotal >= couponDoc.minOrderAmount) {
        if (couponDoc.discountType === 'percentage') {
          discount = Math.floor(subTotal * (couponDoc.discountValue / 100));
        } else {
          discount = couponDoc.discountValue;
        }
        appliedCoupon = couponDoc.code;
        couponDescription = couponDoc.description || '';
      }
    }

    if (appliedCoupon) {
      await Coupon.findOneAndUpdate(
        { code: appliedCoupon },
        { $addToSet: { usedBy: userId } }
      );
    }
    const totalAmount = Math.max(subTotal - discount, 0);

    const DELIVERY_CHARGE = 100;
    let deliveryCharge = 0;
    if (subTotal < 1000) {
      deliveryCharge = DELIVERY_CHARGE;
    }
    const grandTotal = totalAmount + deliveryCharge;

    // 4. Stock check
    for (const item of productsWithOffers) {
      const game = await Game.findById(item.productId);
      if (!game || game.stockQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for ${game ? game.title : 'a product'}` });
      }
    }

    // 5. Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: grandTotal * 100, // in paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: 1
    };
    const razorpayOrder = await razorpay.orders.create(options);

    // 6. Save a pending order in DB
    function generateOrderId(userId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      const day = String(now.getDate()).padStart(2, '0');
      const shortUserId = userId.toString().slice(-4).toUpperCase();
      const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `ORD-${year}${month}${day}-${randomStr}-${shortUserId}`;
    }
    const orderId = generateOrderId(userId);

    const orderItems = productsWithOffers.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      productTitle: item.productTitle || item.name || '',
      discountedPrice: item.price,
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      offerName: item.offerName,
      offerDiscount: item.originalPrice && item.price
      ? (item.originalPrice - item.price) * item.quantity
      : 0,
      status: 'Pending',
    }));
    const totalOfferDiscount = orderItems.reduce((sum, item) => sum + (item.offerDiscount || 0), 0);
    const order = new Order({
      userId: userId,
      items: orderItems,
      paymentMethod: "razorpay",
      totalAmount,
      discount,
      grandTotal,
      deliveryCharge,
      offerDiscount:totalOfferDiscount,
      coupon: appliedCoupon,
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      },
      status: 'Pending'
    });
    await order.save();
        
   
    // 7. Respond with Razorpay order details
    const user = await User.findById(userId);
    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      orderId: razorpayOrder.id,
      _id: order._id,
      userName: user?.name || "Test User",
      userEmail: user?.email || "test@example.com",
      userPhone: user?.phone || "9999999999"
    });

  } catch (error) {
    console.error("Error creating Razorpay order", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const retryRezorpayPayment = async(req,res)=>{
  
  try{
    const orderId = req.params.orderId;
    console.log(orderId)
    const order = await Order.findById(orderId);

    if(!order)
      return res.status(404).send('Order not found');

    const razorpay = new Razorpay({
      key_id:process.env.RAZORPAY_KEY_ID,
      key_secret:process.env.RAZORPAY_KEY_SECRET
    })
    

    const newRazorpayOrder = await razorpay.orders.create({
      amount: order.grandTotal * 100,
      currency: 'INR',
      receipt: order.orderId,
      payment_capture: 1,
    });

    order.razorpayOrderId = newRazorpayOrder.id;
    order.paymentStatus = 'failed';
    await order.save();

    const user = await User.findById(order.userId);
    console.log('orderId ',order._id)
    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: newRazorpayOrder.amount,
      orderId: newRazorpayOrder.id,
      _id:order._id,
      userName: user?.name || "Test User",
      userEmail: user?.email || "test@example.com",
      userPhone: user?.phone || "9999999999"
    });
   


  }catch(error){
    console.error("Error retrying Razorpay payment", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
}
}


export const getPaymentFailedPage = async(req,res)=>{
  try {
    const orderId = req.query.orderId;
   
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId); 
    }
    res.render('user/paymentFailed', { order,page: 'paymentFailed' });
  }catch(error){
       console.error("Error rendering payment failed page", error);
       res.render('user/paymentFailed', { order: null });
    }

}

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.session.userId;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Mark order as paid, reduce stock, clear cart
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, userId });
    
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }

      // Reduce stock
      for (const item of order.items) {
        const game = await Game.findById(item.productId);
        if (game) {
          game.stockQuantity -= item.quantity;
          await game.save();
        }
      }

      order.status = 'Paid';
      order.paymentStatus = 'paid'; //helo
      order.paymentId = razorpay_payment_id;
      await order.save();

      // Clear cart
      await Cart.findOneAndDelete({ userId });

      res.json({ success: true, redirectUrl: "/orderSuccess" });
    } else {
      console.log('this function is triggered one ')
      await Cart.findOneAndDelete({ userId }); 
      console.log('this function is triggered two ')
      res.json({ success: false, message: "Payment verification failed" });
    
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment", error);
    res.json({ success: false, message: "Payment verification failed" });
  }
};

export const clearCart = async(req,res)=>{
  console.log('clearing cart....')
  const userId = req.session.userId;
   await Cart.findOneAndDelete({userId});
   res.json({success:true})
}

export const postPlaceWalletOrder = async (req, res) => {
  try {
    console.log('trigger testing....')
    const userId = req.session.userId;
    const { shippingAddress, coupon } = req.body;

    const cartItems = await Cart.findOne({ userId }).populate("products.productId");
    if (!cartItems || cartItems.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // --- Recalculate offers/discounts for each product ---
    const activeOffers = await getActiveOffers();
    let subTotal = 0;
    let totalSavings = 0;
    let offerDiscount = 0;

    const productsWithOffers = cartItems.products.map(item => {
      const gameObj = item.productId.toObject();
      const itemObj = item.toObject();

      // Find applicable offers
      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' &&
        offer.items.includes(gameObj._id.toString())
      );
      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' &&
        offer.items.includes(gameObj.category._id.toString())
      );

      // Get best offer
      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        itemObj.originalPrice = gameObj.price;
        itemObj.discountPercentage = bestOffer.discountPercentage;
        itemObj.price = calculateDiscountedPrice(gameObj.price, bestOffer.discountPercentage);
        itemObj.offerName = bestOffer.offerName;
        const itemSavings = (gameObj.price - itemObj.price) * item.quantity;
        totalSavings += itemSavings;
        offerDiscount += itemSavings;
      } else {
        itemObj.price = gameObj.price;
      }
      subTotal += itemObj.price * item.quantity;
      return itemObj;
    });

    // Coupon logic
    let discount = 0;
    let appliedCoupon = null;
    let couponDescription = '';
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon, isActive: true,isExpired:false });
      if (couponDoc && subTotal >= couponDoc.minOrderAmount) {
        if (couponDoc.discountType === 'percentage') {
          discount = Math.floor(subTotal * (couponDoc.discountValue / 100));
        } else {
          discount = couponDoc.discountValue;
        }
        appliedCoupon = couponDoc.code;
        couponDescription = couponDoc.description || '';
      }
    }

    if (appliedCoupon) {
      await Coupon.findOneAndUpdate(
        { code: appliedCoupon },
        { $addToSet: { usedBy: userId } }
      );
    }

    const totalAmount = Math.max(subTotal - discount, 0);
    const DELIVERY_CHARGE = 100;
    let deliveryCharge = 0;
    if (subTotal < 1000) {
      deliveryCharge = DELIVERY_CHARGE;
    }
    const grandTotal = totalAmount + deliveryCharge;


    // WALLET LOGIC
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < totalAmount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // Deduct from wallet
    wallet.balance -= grandTotal;
    wallet.transactions.push({
      id: Date.now().toString(),
      type: 'debit',
      amount: grandTotal,
      description: 'Order payment',
      date: new Date(),
      status: 'completed'
    });
    await wallet.save();

    // Reduce stock
    for (const item of productsWithOffers) {
      const game = await Game.findById(item.productId);
      if (!game || game.stockQuantity < item.quantity) {
        return res.status(400).render('error', { message: `Not enough stock for ${game ? game.title : 'a product'}` });
      }
      game.stockQuantity -= item.quantity;
      await game.save();
    }

    // Generate orderId
    function generateOrderId(userId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      const day = String(now.getDate()).padStart(2, '0');
      const shortUserId = userId.toString().slice(-4).toUpperCase();
      const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `ORD-${year}${month}${day}-${randomStr}-${shortUserId}`;
    }
    const orderId = generateOrderId(userId);

    // --- NO GROUPING: just map all items ---
    const orderItems = productsWithOffers.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      productTitle: item.productTitle || item.name || '',
      discountedPrice: item.price,
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      offerName: item.offerName,
      offerDiscount: item.originalPrice && item.price
      ? (item.originalPrice - item.price) * item.quantity
      : 0,
      status: 'Pending',
    }));
    const totalOfferDiscount = orderItems.reduce((sum, item) => sum + (item.offerDiscount || 0), 0);
    // Create order
    const order = new Order({
      userId: userId,
      items: orderItems,
      paymentMethod: "wallet",
      totalAmount,
      discount,
      grandTotal,
      offerDiscount:totalOfferDiscount,
      coupon: appliedCoupon,
      orderId: orderId,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      }
    });
    await order.save();

    // Clear cart
    await Cart.findOneAndDelete({ userId: userId });

    // Respond
    return res.json({ success: true, redirectUrl: "/orderSuccess" });
  } catch (error) {
    console.error("Error while ordering with wallet", error);
    res.status(500).json({ success: false, message: "Server error, please try again." });
  }
};


export const getOrderSuccessPage = async (req, res) => {
  try {

   
    const userId = req.session.userId;

    const cart = await Cart.findOne({userId})
    let cartCount = 0;

    if(cart && cart.products){
      cartCount = cart.products.reduce((total,item)=> total + item.quantity,0)
    }
    res.render("user/orderSuccess", { page: "orderSuccess",cartCount });
  } catch (error) {
    console.error(error);
  }
};



export const getOrderDetailPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Get paginated orders and total count
    const [orders, totalOrders] = await Promise.all([
      Order.find({ userId })
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ userId })
    ]);

    // Cart count
    const cartItems = await Cart.findOne({ userId });
    let cartCount = 0;
    if (cartItems && cartItems.products.length > 0) {
      cartCount = cartItems.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    // Offers mapping
    const activeOffers = await getActiveOffers();
    const mappedOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map(item => {
        const product = item.productId;
        if (!product) return item;

        // Find applicable offers
        const productOffer = activeOffers.find(offer =>
          offer.offerType === 'product' &&
          offer.items.includes(product._id.toString())
        );
        const categoryOffer = activeOffers.find(offer =>
          offer.offerType === 'category' &&
          offer.items.includes(product.category?.toString())
        );

        // Get best offer
        const bestOffer = [productOffer, categoryOffer]
          .filter(Boolean)
          .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

        if (bestOffer) {
          item.originalPrice = product.price;
          item.discountPercentage = bestOffer.discountPercentage;
          item.discountedPrice = Math.round(product.price * (1 - bestOffer.discountPercentage / 100));
          item.offerName = bestOffer.offerName;
        } else {
          item.discountedPrice = product.price;
        }
        return item;
      });
      orderObj.status = order.status || 'Pending';
      return orderObj;
    });

    res.render('user/orderDetails', {
      page: 'orderDetails',
      order: mappedOrders,
      cartCount,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit)
    });
  } catch (error) {
    console.error('Error fetching order details', error);
    res.status(500).render('error', { message: 'Server is down please try after some times' });
  }
};


export const getViewOrderPage = async(req,res)=>{
     try{
         
      const orderId = req.params.id;
      const userId = req.session.userId;
      const cart  = await Cart.findOne({userId});

      let cartCount = 0;

      if(cart && cart.products){
        cartCount = cart.products.reduce((total,item)=>total + item.quantity,0);
      }
     

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId')
      .lean();



      if(!order){
        return res.status(404).rendere('error',{message:'Order not found'});
      }

      const activeOffers = await getActiveOffers();
      order.items = order.items.map(item => {
        const product = item.productId;
        if (!product) return item;
  
        // Find applicable offers
        const productOffer = activeOffers.find(offer =>
          offer.offerType === 'product' &&
          offer.items.includes(product._id.toString())
        );
        const categoryOffer = activeOffers.find(offer =>
          offer.offerType === 'category' &&
          offer.items.includes(product.category?.toString())
        );
  
        // Get best offer
        const bestOffer = [productOffer, categoryOffer]
          .filter(Boolean)
          .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];
  
        if (bestOffer) {
          item.originalPrice = product.price;
          item.discountPercentage = bestOffer.discountPercentage;
          item.discountedPrice = Math.round(product.price * (1 - bestOffer.discountPercentage / 100));
          item.offerName = bestOffer.offerName;
        } else {
          item.discountedPrice = product.price;
        }
        return item;
      });

      let subTotal = 0;
      order.items.forEach(item => {
        const product = item.productId;
        if (product) {
          // Use item.originalPrice if present, else fallback to product.price
          const price = item.originalPrice || product.price;
          subTotal += price * item.quantity;
        }
      });


      res.render('user/viewOrder',{page:'viewOrder',order,cartCount,subTotal});

     }catch(error){
        console.error('Error fetching order details', error);
        res.status(500).render('error',{message:'Server is down please try after some times'});
     }
}



export const postCancelStatus = async(req,res)=>{
  try{
    

  

    const {orderId,itemId} = req.body;

    const order = await Order.findById(orderId);

      if (!order) return res.json({ success: false, error: 'Order not found' });

          const item = order.items.id(itemId);
    if (!item) return res.json({ success: false, error: 'Item not found' });

 if (['Cancelled', 'Delivered', 'Returned'].includes(item.status)) {
      return res.json({ success: false, error: 'Cannot cancel this item' });
    }

    item.status = 'Cancelled';
    await order.save();

    if (['razorpay', 'wallet'].includes(order.paymentMethod)) {
      const userId = order.userId;
      const wallet = await Wallet.findOne({ userId });
      if (wallet) {
       
        let refundAmount = 0;

        if (item.discountedPrice) {
  
          refundAmount = item.discountedPrice * item.quantity;
          if(order.deliveryCharge){
            refundAmount += order.deliveryCharge;
          }
          console.log('refund amount is :',refundAmount)
 
        } else if (item.price) {
          refundAmount = item.price * item.quantity;
          console.log('second refund amount is :',refundAmount)
        } else {
          const product = await Game.findById(item.productId);
          refundAmount = product ? product.price * item.quantity : 0;
        }

        wallet.balance += refundAmount;
        wallet.transactions.push({
          id: Date.now().toString(),
          type: 'credit',
          amount: refundAmount,
          description: `Refund for cancelled order item (${order.orderId})`,
          date: new Date(),
          status: 'completed'
        });
        await wallet.save();
      }
    }

    const product = await Game.findById(item.productId);
    if(product){
      product.stockQuantity += item.quantity;
      await product.save();
    }
    //  await Order.updateOne(
    //   { _id: orderId, "items._id": itemId },
    //   { $set: { "items.$.status": "Cancelled" } }
    // );

    res.json({success:true});
  
   


  }catch(error){
    console.error('Error updating status',error);
    res.status(500).render('error',{message:'Server is down please try after some times'});
    
  }
}

export const postReturnStatus = async(req,res)=>{
  try{
    const {orderId,itemId,reason} = req.body;
    console.log(reason);
    const order = await Order.findById(orderId);
    if(!order)
      return res.json({ success: false, error: 'Order not found' });

    const item = order.items.id(itemId);
     if (!item) return res.json({ success: false, error: 'Item not found' });

     if(item.status!=='Delivered'){
      return res.json({ success: false, error: 'Item not eligible for return' });
     }

   
     item.returnStatus = 'Pending',
     item.returnReason = reason;
    
     await order.save();

     const userId = order.userId;
     const wallet = await Wallet.findOne({ userId });
     if(wallet){
       let refundAmount = 0;
       if(item.discountedPrice){
         refundAmount = item.discountedPrice * item.quantity;
         if(order.deliveryCharge){
          refundAmount += order.deliveryCharge;
        }
       }else if(item.price){
        refundAmount = item.price * item.quantity;
       }else{
        const product = await Game.findById(item.productId);
        refundAmount = product ? product.price * item.quantity : 0;
       }

       wallet.balance +=refundAmount;
       wallet.transactions.push({
        id: Date.now().toString(),
        type: 'credit',
        amount: refundAmount,
        description: `Refund for returned order item (${order.orderId})`,
        date: new Date(),
        status: 'completed'
       })
        await wallet.save();
     }


    res.json({success:true});

  }catch(error){
    console.error('Error updating status',error);
      res.status(500).render('error',{message:'Server is down please try after some times'});
  }
}

export const postApplyCoupon = async (req, res) => {
  try {
    console.log('helo testing')
    const { code } = req.body;
    const cartTotal = Number(req.body.cartTotal);

    console.log('CartTotal:', cartTotal);

    if (isNaN(cartTotal)) {
      return res.status(400).json({ success: false, message: 'Invalid cart total.' });
    }

    console.log('total amount is :', code, cartTotal);

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not valid at this time.' });
    }

    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount for this coupon is ${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    console.log(discount);

    const newTotal = Math.max(cartTotal - discount, 0);
    console.log('total amount new', newTotal);

    return res.json({ success: true, discount, newTotal, message: 'Coupon applied successfully.' });

  } catch (error) {
    console.log('Error applying coupon', error);
    res.json({ success: false, message: "Server error." });
  }
};



// User Subscriber



export const postSubscribeEmail = async (req, res) => {
  try {
    console.log('triggered')
    const { email } = req.body;
    if (!email) {
      return res.json({ success: false, message: 'Email is required.' });
    }

    await Subscriber.updateOne(
      { email },
      { $setOnInsert: { email } },
      { upsert: true }
    );

    // Send welcome email
    const subject = 'Welcome to GameZone Newsletter!';
    const text = `Thank you for subscribing!
You will now receive updates, releases, special offers, and coupons from GameZone.`;

    await sendEmail(email, subject, text, `<h2>Thank you for subscribing!</h2>
      <p>You will now receive updates, releases, special offers, and coupons from GameZone.</p>`);

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: 'Already subscribed or error.' });
  }
};


export const postUnsubscribe = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: 'Email required.' });
  try {
    await Subscriber.deleteOne({ email });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'Unsubscribe failed.' });
  }
}