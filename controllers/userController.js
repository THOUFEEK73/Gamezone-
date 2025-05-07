
import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';
import User from '../models/userModel.js';
import { searchGames } from '../utils/searchFun.js';
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
     
    // const category = await Category.find()

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
    console.log('query is passing ',query);
    const games = await searchGames(query)
    console.log('triggererd')
    return res.json(games)
  }catch(error){
    console.error('Error handling search request:',error);
    res.status(500).render({'error':'Internal Server Error'});
  }
}

// export const getAllGames = async(req,res)=>{
//   try{
//       if(!req.session.userId &&!req.isAuthenticated()){
//         return res.redirect('/login');
//       }
//      const games = await Game.find();
//      res.render('user/allgames',{games});
//   }catch(error){
//     console.error('Error fetching games:',error);
//     res.status(500).send('Internal Server Error');
//   }
// }

