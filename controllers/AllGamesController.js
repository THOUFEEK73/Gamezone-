import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";
import gamecompany from "../models/gamecompany.js";

export const showAllGames = async (req, res) => {
   
    try {
        console.log('showAllGames function called');
      if (!req.session.userId && !req.isAuthenticated()) {
        return res.redirect('/login');
      }
      const companies = await gamecompany.find({status:'active'});
      const games = await Game.find({status:'active'}).populate({path:'category',match:{status:'active'}})
      .then(games=>games.filter(game=>game.category));
      
      const category = await Category.find({status:'active'});
  
      console.log('data is passing');
    
      res.render('user/allgames', { games, category,company:companies});
    } catch (error) {
      console.error('Error fetching allGames', error);
      return res.status(500).render('error', { message: 'Internal Server Error' });
    }
  };