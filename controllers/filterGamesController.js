import Game from "../models/gameModel.js"
import Category from "../models/CategoryModel.js";


const filterGames = async(req, res) => {
    try {
       
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

        // Define sort options
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

        res.json({
            success: true,
            count: games.length,
            games
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



