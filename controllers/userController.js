
import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';
import User from '../models/userModel.js';
import { searchGames } from '../utils/searchFun.js';
import OTP from '../models/otpModel.js';
import {generateOTP} from '../utils/otp-functions.js';
import Address  from '../models/addressModel.js';

import _ from 'lodash';



export const getHomePage = async (req, res) => {
  try {
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

    // Render the home page
    res.render('user/home', { games: games });
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

    res.render('user/profile', { user, messages });

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
     res.render('user/address',{address})
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
    const isDefaultValue = isDefault ==='true';
    
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
      isDefault: isDefaultValue,
    })
          await newAddress.save();
        res.status(200).json({message:'Address saved successfully'});
   
  }catch(error){

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
    

      
     const userId = req.sesion.userId;
     const addressId = req.params.id;
     console.log('function triggered');
     
         const { type, name, phone, street, city, state, zipCode, country, isDefault } = req.body;

            if (!userId) return res.status(401).render('error',{message});

            await Address.updateOne({_id:addressId,userId},{
              type,
              name,
              phone,
              street,
              city,
              zipCode,
              country,
              isDefault:isDefault === 'true' || isDefault ===true
            })

            console.log('updated')



}