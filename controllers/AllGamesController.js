import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";
import gamecompany from "../models/gamecompany.js";
import Cart from '../models/cartModel.js'
import { calculateDiscountedPrice, getActiveOffers } from "../utils/offerUtils.js";

export const showAllGames = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!req.session.userId && !req.isAuthenticated()) {
      return res.redirect('/login');
    }
    const companies = await gamecompany.find({ status: 'active' });

    const genre = req.query.genre || '';

   
    let gameFilter = { status: 'active' };
    if (genre) {
      gameFilter.genre = { $regex: new RegExp('^' + genre + '$', 'i') }; // case-insensitive exact match
    }


    const games = await Game.find(gameFilter)
      .populate({ path: 'category', match: { status: 'active' } })
      .then(games => games.filter(game => game.category));

    const category = await Category.find({ status: 'active' });

    const cart = await Cart.findOne({ userId });
    let cartCount = 0;
    if (cart && cart.products.length > 0) {
      cartCount = cart.products.reduce((total, item) => total + item.quantity, 0);
    }

    const activeOffers = await getActiveOffers();

    const gamesWithOffers = games.map(game => {
      const gameObj = game.toObject();

      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' &&
        offer.items.includes(game._id.toString())
      );

      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' &&
        offer.items.includes(game.category._id.toString())
      );

      const bestOffer = [productOffer, categoryOffer].filter(Boolean).sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        gameObj.originalPrice = game.price;
        gameObj.discountPercentage = bestOffer.discountPercentage;
        gameObj.price = calculateDiscountedPrice(game.price, bestOffer.discountPercentage);
        gameObj.offerName = bestOffer.offerName;
      }

      return gameObj;
    });

-
    res.render('user/allgames', {
      games: gamesWithOffers,
      category,
      cartCount,
      company: companies,
      page: 'store',
      selectedGenre: genre 
    });
  } catch (error) {
    console.error('Error fetching allGames', error);
    return res.status(500).render('error', { message: 'Internal Server Error' });
  }
};









// export const showAllGames = async (req, res) => {
   
//   try {
//     const userId = req.session.userId;
      
//     if (!req.session.userId && !req.isAuthenticated()) {
//       return res.redirect('/login');
//     }
//     const companies = await gamecompany.find({status:'active'});
//     const games = await Game.find({status:'active'}).populate({path:'category',match:{status:'active'}})
//     .then(games=>games.filter(game=>game.category));

//     const category = await Category.find({status:'active'});

//     const cart = await Cart.findOne({userId});
//     let cartCount = 0;
//     if(cart && cart.products.length>0){
//         cartCount = cart.products.reduce((total,item)=>total+item.quantity,0);
//     }
    
   

//     const activeOffers = await getActiveOffers();


//     const gamesWithOffers = games.map(game=>{
//            const gameObj = game.toObject();

//            const productOffer = activeOffers.find(offer => 
//             offer.offerType === 'product' && 
//             offer.items.includes(game._id.toString())
//         );

//         // Find category offer
//         const categoryOffer = activeOffers.find(offer => 
//             offer.offerType === 'category' && 
//             offer.items.includes(game.category._id.toString())
//         );


//            const bestOffer = [productOffer,categoryOffer].filter(Boolean).sort((a,b)=>b.discountPercentage - a.discountPercentage)[0];

//            if(bestOffer){
//               gameObj.originalPrice = game.price;
//               gameObj.discountPercentage = bestOffer.discountPercentage;
//               gameObj.price = calculateDiscountedPrice(game.price, bestOffer.discountPercentage);
//               gameObj.offerName = bestOffer.offerName;
//            }
          
//            return gameObj;
//     })


   
    
  


      
    
  
//     res.render('user/allgames', { games:gamesWithOffers, category,cartCount,company:companies,page:'store'});
//   } catch (error) {
//     console.error('Error fetching allGames', error);

    
//     return res.status(500).render('error', { message: 'Internal Server Error' });
//   }
// };