import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";
import User from "../models/userModel.js";
import { searchGames } from "../utils/searchFun.js";
import OTP from "../models/otpModel.js";
import { generateOTP } from "../utils/otp-functions.js";
import Address from "../models/addressModel.js";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";

import _ from "lodash";
import { response } from "express";
import { compareSync } from "bcryptjs";
// import { getSystemErrorMessage } from "util";

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
    const cart = await Cart.findOne({ userId });

    let cartCount = 0;
    if (cart && cart.products.length > 0) {
      cartCount = cart.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    // Render the home page
    res.render("user/home", { games: games, page: "home", cartCount });
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
  console.log("function triggered");
  const addressId = req.params.id;
  const userId = req.session.user._id;

  try {
    // throw new Error('...')

    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });

    await Address.findByIdAndUpdate(addressId, { $set: { isDefault: true } });

    res.redirect("/address");
  } catch (error) {
    console.error("Error updating isDefault", error);
    res.status(500).render("error", { message: "server error" });
  }
};

// wish list

export const getWishListPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log("function triggered");

    res.render("user/wishlist", { page: "wishlist" });
  } catch (error) {
    console.error("Error while rendering whishList", error);
    res
      .status(500)
      .render("error", { message: "server Error please Try after Some time" });
  }
};

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

    let cartCount = 0;

    if (cartItems && cartItems.products.length > 0) {
      cartCount = cartItems.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    let subTotal = 0;

    cartItems.products.forEach((prd) => {
      const price = Number(prd.price);
      const quantity = Number(prd.quantity);

      subTotal += price * quantity;
    });

    res.render("user/cart", {
      page: "cart",
      cart: cartItems,
      cartCount,
      subTotal,
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
        existingProduct.quantity += 1;

        console.log("productCount", existingProduct);
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
    res.status(200).json({ message: "product added to cart" });
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
    const { itemId, action } = req.body;

    console.log(itemId)

    const cart = await Cart.findOne({ userId }).populate('products.productId') 


    const product = cart.products.id(itemId);

    const game = product.productId;

    const maxAllowed  = Math.floor(game.stockQuantity/2);


    if (action === "increase") {
      if(product.quantity < maxAllowed){
        
          product.quantity += 1;
      }else{
     
      }
     
    } else if (action === "decrease" && product.quantity > 1) {
      product.quantity -= 1;
    }

    await cart.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating the product quantity", error);
    res
      .status(500)
      .render("error", { message: "Server down please try after some times" });
  }
};

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

    req.session.canAccessCheckout = false;

    const userId = req.session.userId;
    const cartItems = await Cart.findOne({ userId }).populate({
      path: "products.productId",
      populate: { path: "company", model: "GameCompany" },
    });
    const address = await Address.find({ userId });

    if (!cartItems || cartItems.products.length === 0) {
      return res.redirect("/cart");
    }
    let cartCount = 0;

    if (cartItems && cartItems.products.length > 0) {
      cartCount = cartItems.products.reduce(
        (total, item) => total + item.quantity,
        0
      );
    }

    let subTotal = 0;

    cartItems.products.forEach((prd) => {
      subTotal = prd.price * prd.quantity;
    });

    res.render("user/checkout", {
      page: "checkout",
      cartCount,
      cart: cartItems,
      subTotal,
      address,
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
    const {shippingAddress} = req.body;
    console.log(shippingAddress.name)
    // const {couponCode} = req.body;

    const cartItems = await Cart.findOne({ userId }).populate(
      "products.productId"
    );

    if (!cartItems || cartItems.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;

    for (let item of cartItems.products) {
      totalAmount += item.productId.price * item.quantity;
    }

    for(const item of cartItems.products){
      const game = await Game.findById(item.productId._id);
  if (!game || game.stockQuantity < item.quantity) {
    return res.status(400).render('error', { message: `Not enough stock for ${game ? game.title : 'a product'}` });
  }
      if(game){
        game.stockQuantity -= item.quantity;
        await game.save()
      }
    }

    function generateOrderId(userId){
      const now = new Date();
      const year = now.getFullYear();
       const month = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      const day = String(now.getDate()).padStart(2,'0');

      const shortUserId = userId.toString().slice(-4).toUpperCase();
      const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `ORD-${year}${month}${day}-${randomStr}-${shortUserId}`;

    }
    const orderId = generateOrderId(userId);
   const productMap = new Map();
for (const item of cartItems.products) {
  const id = item.productId._id.toString();
  if (productMap.has(id)) {
    productMap.get(id).quantity += item.quantity;
  } else {
    productMap.set(id, {
      productId: item.productId._id,
      quantity: item.quantity,
      productTitle:item.productId.title,
      
    });
  }
}
const groupedItems = Array.from(productMap.values()).map(item=>({
  ...item,
  status:'Pending',
}))
    const order = new Order({
      userId: userId,
      items: groupedItems,
      paymentMethod: "cod",
      totalAmount,
      orderId:orderId,
      shippingAddress:{
        name:shippingAddress.name,
        phone:shippingAddress.phone,
        city:shippingAddress.city,
        state:shippingAddress.state,
        zipCode:shippingAddress.zipCode,
        country:shippingAddress.country,
      }
    });

    await order.save();

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

export const getOrderSuccessPage = async (req, res) => {
  try {
    res.render("user/orderSuccess", { page: "orderSuccess" });
  } catch (error) {
    console.error(error);
  }
};



export const getOrderDetailPage = async(req,res)=>{
   try{
 
    const userId = req.session.userId;
    
    const orders = await Order.find({userId}).sort({createdAt:-1});

   
    const orderId = orders.orderId;
   
    res.render('user/orderDetails',{page:'orderDetails',order:orders})
   }catch(error){

   }
     
}


export const getViewOrderPage = async(req,res)=>{
     try{
         
      const orderId = req.params.id;
      const userId = req.session.userId;
      console.log('triggered')

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId')
      .lean();

  console.log(order)

console.log(order)
      if(!order){
        return res.status(404).rendere('error',{message:'Order not found'});
      }


   



      res.render('user/viewOrder',{page:'viewOrder',order});

     }catch(error){

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
    res.json({success:true});

  }catch(error){
    console.error('Error updating status',error);
      res.status(500).render('error',{message:'Server is down please try after some times'});
  }
}

