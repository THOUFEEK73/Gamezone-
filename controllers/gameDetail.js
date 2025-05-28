
import Game from "../models/gameModel.js";
import User from "../models/userModel.js";
import Cart from '../models/cartModel.js'





  

export const getDetailPage = async(req ,res)=>{
    try{
       
        
        const gameId = req.params.id;
        const user = req.session.userId;

       
        const game = await Game.findById(gameId).populate('category').populate('company');

        if(!game || game.status !=='active'){
            return res.status(404).render('user/gameUnavailable',{message:'This game is currently unavailable'});
        }

        const relatedCompanies = await Game.find({
                 company:game.company._id,
                 _id:{$ne:game._id},
                 status:'active'
        }).limit(5)

        
        const relatedGames = await Game.find({
                 category: game.category._id,
             _id: { $ne: game._id }, //$ne this will exclude the game
                 status:'active'  
           
        }).limit(5);

 

        // cart count 

        const cartItems= await Cart.findOne({userId:user})
            // Cart count logic
            console.log(cartItems);
            
    
     let cartCount = 0;

  if(cartItems && cartItems.products.length>0){

      cartCount = cartItems.products.reduce((total,item)=>total + item.quantity,0);

  }



  
    
        console.log('totalCount',cartCount);
        
       
    

         res.render('user/gamedetail',{game,relatedGames,relatedCompanies,user,page:'gameDetail',cartCount});

    }catch(err){
        console.error('Error fetching game details:',err);
        res.status(500).render('error',{message:'Internal Server Error'});  
    }
}