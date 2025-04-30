import Game from "../models/gameModel.js";





  

export const getDetailPage = async(req ,res)=>{
    try{
        const gameId = req.params.id;
        console.log(gameId)
        
        const game = await Game.findById(gameId).populate('category');

        if(!game){
            return res.status(404).send('Game not Found');
        }
        const   relatedGames = await Game.find({
            category: game.category._id,
            _id: { $ne: game._id } 
        }).limit(4);

         res.render('user/gamedetail',{game,relatedGames})

    }catch(err){
        console.error('Error fetching game details:',err);
        res.status(500).send('Internal Server Error');  
    }
}