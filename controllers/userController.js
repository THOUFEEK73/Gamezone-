
import Game from '../models/gameModel.js';
import User from '../models/userModel.js';
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
    const games = await Game.find().limit(8);

    // Render the home page
    res.render('user/home', { games: games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).send('Internal Server Error');
  }
};

export const getAllGames = async(req,res)=>{
  try{
      if(!req.session.userId &&!req.isAuthenticated()){
        return res.redirect('/login');
      }
     const games = await Game.find();
     res.render('user/allgames',{games});
  }catch(error){
    console.error('Error fetching games:',error);
    res.status(500).send('Internal Server Error');
  }
}

