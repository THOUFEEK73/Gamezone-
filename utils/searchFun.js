import Game from '../models/gameModel.js';

export const searchGames = async (query) => {
    try {
        if(!query){
            return await Game.find();
        }
        const regex = new RegExp(query, 'i'); 
        const games = await Game.find({ title: regex });
        return games;
    } catch (error) {
        console.error('Error searching games:', error);
        throw error;
    }
};