import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";
import gamecompany from "../models/gamecompany.js";
import Cart from '../models/cartModel.js'

export const showAllGames = async (req, res) => {
   
    try {
      const userId = req.session.userId;
        console.log(userId);
      if (!req.session.userId && !req.isAuthenticated()) {
        return res.redirect('/login');
      }
      const companies = await gamecompany.find({status:'active'});
      const games = await Game.find({status:'active'}).populate({path:'category',match:{status:'active'}})
      .then(games=>games.filter(game=>game.category));
     
      
      
      const category = await Category.find({status:'active'});
  
      const cart = await Cart.findOne({userId});
      

      
    
  
    let cartCount = 0;
      if(cart && cart.products.length>0){
          cartCount = cart.products.reduce((total,item)=>total+item.quantity,0);
      }
      
     
        
      
    
      res.render('user/allgames', { games, category,cartCount,company:companies,page:'store'});
    } catch (error) {
      console.error('Error fetching allGames', error);
      console.log('functioning');
      
      return res.status(500).render('error', { message: 'Internal Server Error' });
    }
  };