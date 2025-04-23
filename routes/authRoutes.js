
import express from "express";
import { getSignUpPage, getLoginPage, postSignUp, postLogin, verifyOTP, resendOTP, logout } from "../controllers/authController.js";
import  isAthenticated  from "../middleware/auth.js"
import Game from "../models/gameModel.js";
const router = express.Router();

// Existing routes
router.get("/login", getLoginPage);
router.post("/login", postLogin);
router.get("/signup", getSignUpPage);
router.post("/signup", postSignUp);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Add logout route
router.get('/logout', logout);
// router.get('/',isAthenticated,async (req,res)=>{
//   try{
//     res.setHeader('Cache-Control', 'no-cache, no-store');
//     const games = await Game.find();
//     res.render('user/home',{games});
//   }catch(err){
//     console.error('Error fetching games',err);
//     res.status(500).send('Internal Server Error');
//   }
 
// })

router.get('/home',isAthenticated, async (req, res) => {
  try {
    // Fetch all games from the database
    const games = await Game.find();

    // Render the home.ejs template and pass the games array
    res.render('user/home', { games: games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).send('Internal Server Error');
  }
});
export default router;