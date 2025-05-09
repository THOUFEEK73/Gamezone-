import Game from "../models/gameModel.js";
import Category from "../models/CategoryModel.js";
import { uploadToCloudinary } from "../utils/cloudinaryUtils.js";
import GameCompany from '../models/gamecompany.js';

export const editGamePage = async(req,res)=>{
    try{
        const gameId = req.params.id;
        const game = await Game.findById(gameId).populate('category').populate('company');
        const companies = await GameCompany.find();
        const categories = await Category.find();
        
        if(!game){
            return res.status(404).render('error',{message:'Game not found'});
        }

        res.render('admin/editgame',{
            game,
            category: categories,
            errors: {},
            companies,
        });
         
    }catch(error){
      console.error('Error fetching game details:',error);
        res.status(500).render('error',{message:'Internal Server Error'});
    }
}

export const postEditGame = async (req, res) => {
    try {
        const gameId = req.params.id;
        const { title, price, category, description, releaseDate, stockQuantity, status, company, existingScreenshots } = req.body;
        console.log(gameId)
        // Upload images first if they exist
        let coverImageUrl = null;
        let screenshotsUrls = [];

        // Handle cover image upload
        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            const coverUpload = await uploadToCloudinary(
                req.files.coverImage[0].buffer,
                'games/coverImages'
            );
            coverImageUrl = coverUpload.secure_url;
        }

        // Handle screenshots
        screenshotsUrls = existingScreenshots ? 
            (Array.isArray(existingScreenshots) ? existingScreenshots : [existingScreenshots]) : 
            [];

        if (req.files && req.files.screenshots && req.files.screenshots.length > 0) {
            const newScreenshotUrls = await Promise.all(
                req.files.screenshots.map(async (file) => {
                    const upload = await uploadToCloudinary(file.buffer, 'games/screenshots');
                    return upload.secure_url;
                })
            );
            screenshotsUrls = [...screenshotsUrls, ...newScreenshotUrls];
        }
         console.log('successfull')
        // Store form data and uploaded images in session
        req.session.formData = { 
            title, 
            price, 
            description, 
            releaseDate, 
            stockQuantity, 
            status, 
            category,
            company,
            media: {
                coverImage: coverImageUrl,
                screenshots: screenshotsUrls
            }
        };
            
        const categories = await Category.find();
        const game = await Game.findById(gameId);
        console.log('final test')
        const errors = {};

        // Validate title
        if(!title || title.trim()===""){
            errors.title = 'Game title is required';
        } else if(title.length < 3) {
            errors.title = 'Game title must be at least 3 characters long';
        }

        // Validate price
        if(!price || price.trim()===""){
            errors.price = 'Game price is required';
        } else if(parseFloat(price) <= 0){
            errors.price = 'Price must be greater than zero';
        } else if(parseFloat(price) > 999999) {
            errors.price = 'Price cannot exceed 999,999';
        }

        // Validate description
        if(!description || description.trim()===""){
            errors.description = 'Game description is required';
        } 

        // else if(description.length < 20) {
        //     errors.description = 'Description must be at least 20 characters long';
        // }

        // Validate release date

        if(game.releaseDate && !(game.releaseDate instanceof Date)){
            game.releaseDate  = new Date(game.releaseDate);
        }
        if (!game.releaseDate || isNaN(new Date(game.releaseDate).getTime())) {
            game.releaseDate = new Date(); // Default to the current date
        }
        if(!releaseDate || releaseDate.trim()===""){
            errors.releaseDate = 'Release date is required';
        } else {
            const date = new Date(releaseDate);
            if(isNaN(date.getTime())) {
                errors.releaseDate = 'Please enter a valid date';
            }
        }

        // Validate stock quantity
        if(!stockQuantity || stockQuantity.trim()===""){
           errors.stockQuantity = 'Stock quantity is required';
        } else if(parseInt(stockQuantity) < 0){
            errors.stockQuantity = 'Stock quantity cannot be negative';
        } else if(parseInt(stockQuantity) > 99999) {
            errors.stockQuantity = 'Stock quantity cannot exceed 99,999';
        }

        // Validate status
        if(!status || status.trim()===""){
            errors.status = 'Game status is required';
        } else if(!['active', 'inactive'].includes(status.toLowerCase())) {
            errors.status = 'Invalid status selected';
        }

        // Validate category
        if(!category || category.trim()===""){
           errors.category = 'Game category is required';
        }

        // Validate platform
        if(!company || company.trim()===""){
            errors.company = 'Game company name is required';
        }

        // Validate cover image for new games
        if (!game.media?.coverImage && (!req.files?.coverImage || !req.files.coverImage[0])) {
            errors.coverImage = 'Cover image is required';
        }

        if (Object.keys(errors).length > 0) {
            const formGame = { 
                ...req.session.formData, 
                _id: gameId,
                media: {
                    coverImage: coverImageUrl || game.media?.coverImage,
                    screenshots: screenshotsUrls.length > 0 ? screenshotsUrls : game.media?.screenshots || []
                }
            };
        
            if (formGame.releaseDate) {
                formGame.releaseDate = new Date(formGame.releaseDate);
            }
        
            return res.render('admin/editgame', {
                errors,
                game: formGame,
                category: categories
            });
        }

        const updateGame = {
            title,
            price,
            category,
            description,
            releaseDate,
            stockQuantity,
            status,
            company,
            media: {
                coverImage: coverImageUrl || game.media?.coverImage,
                screenshots: screenshotsUrls
            }
        };

        await Game.findByIdAndUpdate(gameId, updateGame);
        req.session.formData = null; // Clear session data after successful update
        res.redirect('/admin/games');
    } catch (error) {
        console.error("Error updating game:", error);
        res.status(500).render('error', { message: 'Something went wrong' });
    }
};