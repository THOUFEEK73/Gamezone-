import Game from "../models/gameModel.js";


export const getDetailPage = async(req ,res)=>{
    try{
        const gameId = req.params.id;
        
        console.log(gameId)
        const game = await Game.findById(gameId);

        if(!game){
            return res.status(404).send('Game not Found');
        }

         res.render('user/gamedetail',{game})

    }catch(err){
        console.error('Error fetching game details:',err);
        res.status(500).send('Internal Server Error');  
    }
}