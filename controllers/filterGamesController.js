import Game from "../models/gameModel.js"
import Category from "../models/CategoryModel.js";


const filterGames = async(req,res)=>{

    try{
        console.log('working')
        const {genres,maxPrice}  = req.body;
        console.log(genres,maxPrice);
       const category = await Category.find();
        const query={
            price:{$lte:maxPrice}
        };

        if(genres && genres.length >0){
            query.category = {$in:genres};
        }

        const games = await Game.find(query).populate('category');
        res.json({games});

    }catch(error){

    }

}
export default filterGames;