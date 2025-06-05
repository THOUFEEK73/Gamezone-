import Game from "../models/gameModel.js"
import Category from "../models/CategoryModel.js";
import { calculateDiscountedPrice, getActiveOffers } from "../utils/offerUtils.js";


const filterGames = async(req, res) => {
    try {
      
        const {genres, maxPrice, companies, sort} = req.body;
        
        const category = await Category.find();
        const query = {
            // price: {$lte: maxPrice},
            status: 'active'
        };

        if(genres && genres.length > 0) {
            query.category = {$in: genres};
        }
        if(companies && companies.length > 0) {
            query.company = {$in: companies};
        }

        // Apply query with sort
        const games = await Game.find(query)
            .populate('category')
            .populate('company')
           
 

        const activeOffers = await getActiveOffers();

        const gamesWithOffers = games.map(game =>{
            const gameObj = game.toObject();

            const producOffer = activeOffers.find(offer=>
                 offer.offerType ==='product'
                 && offer.items.includes(game._id.toString()) &&
                 offer.isActive
            )

            const categoryOffer = activeOffers.find(offer =>
                offer.offerType === 'category' && 
                offer.items.includes(game.category._id.toString()) &&
                offer.isActive
            );

            const bestOffer = [producOffer, categoryOffer].filter(Boolean).sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

            if(bestOffer){
                gameObj.originalPrice = gameObj.price;
                gameObj.discountPercentage = bestOffer.discountPercentage;
                gameObj.price = calculateDiscountedPrice(game.price, bestOffer.discountPercentage);
                gameObj.offerName = bestOffer.offerName;
            }

            return gameObj;


        }).filter(game=>game.price <=maxPrice);

       
        
          // Sort after applying offers
          let sortedGames = [...gamesWithOffers];
          switch(sort) {
              case 'az':
                  sortedGames.sort((a, b) => a.title.localeCompare(b.title));
                  break;
              case 'za':
                  sortedGames.sort((a, b) => b.title.localeCompare(a.title));
                  break;
              case 'price-low':
                  sortedGames.sort((a, b) => a.price - b.price);
                  break;
              case 'price-high':
                  sortedGames.sort((a, b) => b.price - a.price);
                  break;
              default:
                  sortedGames.sort((a, b) => a.title.localeCompare(b.title));
          }
  
          res.json({
              success: true,
              count: sortedGames.length,
              games: sortedGames
          });

    } catch(error) {
        console.error('Error filtering games:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to filter games',
            error: error.message
        });
    }
}
export default filterGames;



