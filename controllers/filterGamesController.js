import Game from "../models/gameModel.js"
import Category from "../models/CategoryModel.js";
import { calculateDiscountedPrice, getActiveOffers } from "../utils/offerUtils.js";


const filterGames = async(req, res) => {
    try {
       console.log('simply filtering games')
        const {genres, maxPrice, companies, sort} = req.body;
         console.log('sorting here ',sort)
        const category = await Category.find();
        const query = {
            price: {$lte: maxPrice},
            status: 'active'
        };

        if(genres && genres.length > 0) {
            query.category = {$in: genres};
        }
        if(companies && companies.length > 0) {
            query.company = {$in: companies};
        }

        
        let sortOption = {};
        switch(sort) {
            case 'az':
                sortOption = { title: 1 };
                break;
            case 'za':
                sortOption = { title: -1 };
                break;
            case 'price-low':
                sortOption = { price: 1 };
                break;
            case 'price-high':
                sortOption = { price: -1 };
                break;
            default:
                sortOption = { title: 1 };
        }

        // Apply query with sort
        const games = await Game.find(query)
            .populate('category')
            .populate('company')
            .sort(sortOption);
 
          
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


            })


        res.json({
            success: true,
            count: games.length,
            games:gamesWithOffers
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



