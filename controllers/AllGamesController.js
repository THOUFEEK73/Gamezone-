import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";

export const showAllGames = async (req, res) => {
   
    try {
        console.log('showAllGames function called');
      if (!req.session.userId && !req.isAuthenticated()) {
        return res.redirect('/login');
      }
  
      const games = await Game.find();
      const category = await Category.find();
  
      console.log('data is passing');
      res.render('user/allgames', { games, category });
    } catch (error) {
      console.error('Error fetching allGames', error);
      return res.status(500).render('error', { error: 'Internal Server Error' });
    }
  };