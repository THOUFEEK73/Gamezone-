
import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';
import User from '../models/userModel.js';
import { searchGames } from '../utils/searchFun.js';
import OTP from '../models/otpModel.js';
import {generateOTP} from '../utils/otp-functions.js'; 

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


export const getAddressPage = (req,res)=>{
  try{
     res.render('user/address')
  }catch(error){

  }
}

export const postEditProfile =async (req,res)=>{
  try{

    const userId = req.session.userId;
       const {name,email,phone} = req.body;

       if(email !==req.user.email){
        await User.findByIdAndUpdate(userId,{name,email,phone},{new:true});
        req.flash('success','Profile partially updated . Please verify your new email.')
       }else{
        await User.findByIdAndUpdate(userId,{name,email,phone},{new:true});
        req.flash('success','Profile updated successfully');
       }

       res.redirect('/profile');
    
  

      // req.flash('success','profile updated successfully');
      // res.redirect('/profile');

  }catch(error){
    console.error('Error updating profile:', error);
        req.flash('error', 'Failed to update profile');
        res.redirect('/user/profile');
  }
}


export const postVerifyEmail = async(req,res)=>{
  try{ 
    console.log('triggered');   
    const {email, verificationCode} = req.body;
    console.log(email, verificationCode);
    const userId = req.session.userId;
    
    if(!email){
      req.flash('error','Email is required');
      return res.redirect('/user/profile');
    }

    const existingUser = await User.findOne({email, _id: { $ne: userId }});
    if(existingUser){
      req.flash('error','Email already exists');
      return res.redirect('/user/profile');
    }

    const otpRecord = await OTP.findOne({email});
    if(!otpRecord || otpRecord.otp !== verificationCode){
      req.flash('error','Invalid OTP');
      return res.redirect('/user/profile');
    }

    //update user email
    await User.findByIdAndUpdate(userId, {email});
    await OTP.deleteOne({email});

    req.flash('success','Email verified successfully');
    return res.redirect('/user/profile');
  }catch(error){
     console.error('Error verifying email:', error);
     return res.status(500).json({success:false, message:'Internal Server Error'});
  }
}

export const sendVerificationCode = async (req,res)=>{
  try{
    const {email} = req.body;
    const userId = req.session.userId;

    if(!email){
      return res.status(400).json({success:false, message:'Email required'});
    }
    
    const existingUser = await User.findOne({email, _id: { $ne: userId }});
    if(existingUser){
      return res.status(400).json({success:false, message:'Email already exists'});
    }

    await OTP.deleteOne({email});

    const otpSent = await generateOTP(email);
    if(!otpSent){
      return res.status(500).json({success:false, message:'Failed to send OTP'});
    }

    return res.status(200).json({success:true, message:'OTP sent successfully'});
  }catch(error){
    console.error('Error sending verification code:', error);
    return res.status(500).json({success:false, message:'Internal Server Error'});
  }
}

