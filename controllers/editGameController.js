import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";

 export const editGamePage  = async(req,res)=>{
    try{
        console.log('testing');
        
        const gameId = req.params.id;
        const game = await Game.findById(gameId).populate('category');
        const categories = await Category.find();

        // console.log('Game:',game);
        
        if(!game){
            return res.status(404).render('error',{message:'Game not found'});
        }

        res.render('admin/editgame',{game,category:categories})
         
    }catch(error){
      console.error('Error fetching game details:',error);
        res.status(500).render('error',{message:'Internal Server Error'});
    }
}

export const postEditGame = async (req, res) => {
    try {
        

        const gameId = req.params.id;
        const { title, price, category, description, releaseDate, stockQuantity, status } = req.body;

        const error ={};

        if(parseFloat(price)<0){
            error.price = 'Price must be greater than 0';
            console.log('error');
        }

        let coverImageUrl = null;
        let screenshotsUrls = [];

        // Upload cover image if exists
        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            const coverUpload = await uploadToCloudinary(
                req.files.coverImage[0].buffer,
                'games/coverImages'
            );
            coverImageUrl = coverUpload.secure_url;
        }

        // Upload screenshots if any
        if (req.files && req.files.screenshots && req.files.screenshots.length > 0) {
            screenshotsUrls = await Promise.all(
                req.files.screenshots.map(async (file) => {
                    const upload = await uploadToCloudinary(file.buffer, 'games/screenshots');
                    return upload.secure_url;
                })
            );
        }

        const updateGame = {
            title,
            price,
            category,
            description,
            releaseDate,
            stockQuantity,
            status,
        };

        // Add media if uploaded
        if (coverImageUrl || screenshotsUrls.length > 0) {
            updateGame.media = {};
            if (coverImageUrl) updateGame.media.coverImage = coverImageUrl;
            if (screenshotsUrls.length > 0) updateGame.media.screenshots = screenshotsUrls;
        }

        await Game.findByIdAndUpdate(gameId, updateGame);
        res.redirect('/admin/games');

    } catch (error) {
        console.error("Error updating game:", error);
        res.status(500).render('error', { message: 'Something went wrong' });
    }
};
