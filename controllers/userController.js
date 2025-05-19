import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';
import User from '../models/userModel.js';
import { searchGames } from '../utils/searchFun.js';
import OTP from '../models/otpModel.js';
import {generateOTP} from '../utils/otp-functions.js';
import Address  from '../models/addressModel.js';
import Cart from '../models/cartModel.js'

import _ from 'lodash';
import { response } from 'express';



export const getHomePage = async (req, res) => {
  try {

    const userId = req.session.userId;
    // Check if user is authenticated
    if (!req.session.userId && !req.isAuthenticated()) {
      return res.redirect('/login');
    }

    // Set cache control headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
     
   

    // Fetch all games from the database
    const games = await Game.find({status:'active'}).populate({path:'category',match:{status:'active'}}).limit(10).
    then(games=>games.filter(game=>game.category))
  const cart = await Cart.findOne({userId});
    
  
     let cartCount = 0;
      if(cart && cart.products.length>0){
          cartCount = cart.products.reduce((total,item)=>total+item.quantity,0);
      }

    
      
    // Render the home page
    res.render('user/home', { games: games,page:'home',cartCount });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).send('Internal Server Error');
  }
};

export const homePageSearch  = async(req,res)=>{
  try {
    const query = req.query.query || '';
    const games = await searchGames(query);
    return res.json({ games,status:'active' });
} catch (error) {
    console.error('Error handling search request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
  
}

export const allGameSearch = async(req,res) =>{
  try{
  
    const query = req.query.query || '';

    const games = await searchGames(query)
    console.log('triggererd')
    return res.json(games)
  }catch(error){
    console.error('Error handling search request:',error);
    console.error('Error handling search request:',error);
    res.status(500).render({'error':'Internal Server Error'});
  }
}


export const getProfilePage = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      // req.flash('error', 'You must be logged in to view your profile');
      return res.redirect('/login');
    }

    const user = await User.findById(userId);
    const messages = {
      success: req.flash('success'),
      error: req.flash('error')
    };

    res.render('user/profile', { user, messages,page:'profile' });

  } catch (error) {
    console.error('Error rendering profile page:', error);
    res.status(500).send('Internal Server Error');
  }
};


export const getAddressPage =async (req,res)=>{
  try{
     const userId = req.session.userId;
     if(!userId) return res.redirect('/login');
     const address = await Address.find({userId});
     res.render('user/address',{address,page:'address'})
  }catch(error){
   console.error('Error fetching address page ',error);
   res.status(500).send('Internal Server Error');
  }
}

export const postEditProfile =async (req,res)=>{
  try{

    const userId = req.session.userId;
       const {name,phone} = req.body;

   
        await User.findByIdAndUpdate(userId,{name,phone},{new:true});
        req.flash('success','Profile updated successfully');
       
       console.log('function here ')
       res.redirect('/profile');
    

  }catch(error){
    console.error('Error updating profile:', error);
        req.flash('error', 'Failed to update profile');
        res.redirect('/user/profile');
  }
}


export const postVerifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const userId = req.session.userId;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord || otpRecord.otp !== verificationCode) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    await User.findByIdAndUpdate(userId, { email });
    await OTP.deleteOne({ email });
   
  
     res.status(200).json({ success: true, message: 'Email verified successfully'});


  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.session.userId;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    await OTP.deleteOne({ email });

    const otpSent = await generateOTP(email);
    if (!otpSent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const postAddress = async(req,res)=>{
   
  try{
    const userId = req.session.userId;

    if(!userId){
      return res.status(401).json({error:'Unauthorized'});
    }
    const {type,name,phone,street,city,state,zipCode,country,isDefault} = req.body;
    console.log(name,phone)
  
    if(isDefault==='true' || isDefault===true){
      await Address.updateMany({user:userId,isDefault:true},{$set:{isDefault:false}})
    }

    const newAddress = new Address ({
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
    })
          await newAddress.save();
        res.status(200).json({message:'Address saved successfully'});
   
  }catch(error){
    console.error('Error adding address:',error);
    res.status(500).render('error',{message:'Internal Server Error'});
  }

}


export const deleteAddress = async(req,res)=>{
    try{
      const userId = req.session.userId;
      const addressId = req.params.id;
      if(!userId) 
        return res.status(401).render('error',{message:'Unathorized'});
      const result = await Address.deleteOne({_id:addressId,userId});

      if(result.deletedCount===1){
        return res.status(200).json({message:'Address deleted'});
      }else{
        return res.status(404).json({error:'Address not found'});
      }
    }catch(error){
      console.error('Error deleting address',error);
      res.status(500).json({error:'Failed to delete address'});
      
    }
}

export const postEditAddress = async(req,res)=>{
    

      
     const userId = req.session.userId;
     const addressId = req.params.id;
     console.log(addressId);
     
         const { type, name, phone, street, city, state, zipCode, country, isDefault } = req.body;

            if (!userId) return res.status(401).render('error',{message});

            if(isDefault){
              console.log('testingc');
              
              await Address.updateMany({user:userId},{$set:{isDefault:false}});
            }
            console.log('testing 2');
            
            await Address.findByIdAndUpdate(addressId,{
              type,
              name,
              phone,
              street,
              city,
              zipCode,
              state,
              country,
              isDefault:!!isDefault
            })

            

        res.json({success:true});




}



export const postSetDefault = async(req,res)=>{
  console.log('function triggered');
   const addressId = req.params.id;
  const userId = req.session.user._id; 

  try{

    // throw new Error('...')

    await Address.updateMany({user:userId},{$set:{isDefault:false}});

    await Address.findByIdAndUpdate(addressId,{$set:{isDefault:true}});

    res.redirect('/address')

  }catch(error){
    console.error('Error updating isDefault',error);
    res.status(500).render('error',{message:'server error'})
  }

}




// wish list

export const getWishListPage = async(req,res)=>{
     try{
       const userId = req.session.userId;
       console.log('function triggered');

       res.render('user/wishlist',{page:'wishlist'});
       
     }catch(error){
      console.error('Error while rendering whishList',error);
      res.status(500).render('error',{message:'server Error please Try after Some time'});
      
     }
}

export const getCartPage = async(req,res)=>{
  try{
   
    const userId = req.session.userId;
    const cartItems = await Cart.findOne({userId,}).populate({path:'products.productId',populate:{path:'company',model:'GameCompany'}});
  console.log("Populated Cart:", JSON.stringify(cartItems, null, 2));

  let cartCount = 0;

  if(cartItems && cartItems.products.length>0){

      cartCount = cartItems.products.reduce((total,item)=>total + item.quantity,0);

  }



  


    res.render('user/cart',{page:'cart',cart:cartItems,cartCount});
    

  }catch(error){

    console.error('Error while rendering cart',error);
    res.status(500).render('error',{message:'server Error please Try after Some time'});
    

  }
}


export const postAddCart = async(req,res)=>{

    try{

          const {productId} = req.body;
    const userId = req.session.userId;


      let cart = await Cart.findOne({userId});

    
      
 

      if(!cart){
         cart = new Cart({
          userId,
          products:[{productId,quantity:1}],
       
         })
      }else{
       
        const existingProduct = cart.products.find((prd)=>prd.productId.toString()===productId.toString());
          if(existingProduct){
        existingProduct.quantity+=1;
 
        
        console.log('productCount',existingProduct);
      }else{
        cart.products.push({productId,quantity:1});
      }
      }

  
         
       await cart.save();
       res.status(200).json({message:'product added to cart'})

    }catch(error){

      console.error('Error adding product to cart',error);
      res.status(500).render('error',{message:'server error please try after someTimes'});
      

    }

}