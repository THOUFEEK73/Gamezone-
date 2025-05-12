import Game from "../models/gameModel.js"
import Category from "../models/CategoryModel.js";


const filterGames = async(req,res)=>{

    try{
        console.log('function triggered')
        const {genres,maxPrice,companies}  = req.body;
     
       const category = await Category.find();
        const query={
            price:{$lte:maxPrice}
        };

        if(genres && genres.length >0){
            query.category = {$in:genres};
        }
        if(companies && companies.length>0){
            query.company = {$in:companies}
        }

        const games = await Game.find({...query,status:'active'}).populate('category').populate('company');
        res.json({games});

    }catch(error){
        console.error('Error filtering games:', error);
        res.status(500).render( 'error',{message: 'Failed to filter games' });
    }

}
export default filterGames;



