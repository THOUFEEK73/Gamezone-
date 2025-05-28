import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';

export const searchGames = async (query) => {
    try {
       
      
        const activeCategories = await Category.find({status:'active'}).select('_id');
        console.log(activeCategories)
        const filter = {
            status:'active',
            category:{$in:activeCategories.map(category=>category._id)}
        }
        if(query){
            const regex = new RegExp(query, 'i'); 
            filter.title = regex;
       
            // return await Game.find();
        }
      
        const games = await Game.find(filter);
        return games;
    } catch (error) {
        console.error('Error searching games:', error);
        throw error;
    }
};