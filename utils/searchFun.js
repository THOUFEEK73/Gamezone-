import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';
import Offer from '../models/offerModel.js';
import { calculateDiscountedPrice,getActiveOffers} from './offerUtils.js';



export const searchGames = async (query) => {
    try {
       
      
        const activeCategories = await Category.find({status:'active'}).select('_id');
       
        const filter = {
            status:'active',
            category:{$in:activeCategories.map(category=>category._id)}
        }
        if(query){
            const regex = new RegExp(query, 'i'); 
            filter.title = regex;
       
            // return await Game.find();
        }
      
        const games = await Game.find(filter).populate('category');

        //Get active offers for games

        const now = new Date();
        // const activeOffers = await Offer.find({
        //     isActive:true,
        //     startDate:{$lte:now},
        //     endDate:{$gte:now}
        // })

        const activeOffers = await getActiveOffers();

            const gamesWithOffers = games.map(game=>{
            const gameObj = game.toObject();

            const productOffer = activeOffers.find(offer => 
                offer.offerType === 'product' && 
                offer.items.includes(game._id.toString())
            );

            // Find category offer
            const categoryOffer = activeOffers.find(offer => 
                offer.offerType === 'category' && 
                offer.items.includes(game.category._id.toString())
            );

           const bestOffer = [productOffer, categoryOffer].filter(offer => offer).sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

           if(bestOffer){
             gameObj.originalPrice = game.price;
             gameObj.discountPercentage = bestOffer.discountPercentage;
             gameObj.price = calculateDiscountedPrice(game.price,bestOffer.discountPercentage);
             gameObj.offerName = bestOffer.offerName
           }
         
           return gameObj;

        })

        return gamesWithOffers;
    } catch (error) {
        console.error('Error searching games:', error);
        throw error;
    }
};