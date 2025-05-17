
import Game from "../models/gameModel.js";





  

export const getDetailPage = async(req ,res)=>{
    try{
       
        
        const gameId = req.params.id;
       
       
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

    

         res.render('user/gamedetail',{game,relatedGames,relatedCompanies});

    }catch(err){
        console.error('Error fetching game details:',err);
        res.status(500).render('error',{message:'Internal Server Error'});  
    }
}