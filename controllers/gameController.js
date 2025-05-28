import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';
import { uploadToCloudinary } from '../utils/cloudinaryUtils.js';
import gamecompany from '../models/gamecompany.js';

export const getAllGames = async (req, res) => {
    try {
        // const category = await Category.find();
        // console.log(category)
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip   = (page - 1) * limit;
        const totalGames = await Game.countDocuments();
        const totalPages = Math.ceil(totalGames / limit);
        const companies = await gamecompany.find()

        const games = await Game.find().skip(skip).limit(limit).populate('category','categoryName');
        res.render('admin/games', {games:games,totalPages,currentPage:page,company:companies});
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
};

// export const uploadImages = upload.fields([
//     {name:'coverImage',maxCount:1},
//     {naem:'Screenshots',maxCount:4},
// ])

export const addGame = async (req, res) => {
    try {
        const companies = await gamecompany.find({status:'active'})
       
        const category = await Category.find()
        const data = await Game.find()
        res.render('admin/addgame', { errors: {}, data, category,companies });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to render add game page' });
    }
};

export const postGameDetails = async (req, res) => {
    try {
        const { title, price, company, description, releaseDate, stockQuantity, status, category } = req.body;
        req.session.formData = { title, price,company, description, releaseDate, stockQuantity, status, category };
        console.log('this is the company',company)
        console.log('this is category',category)
        const categories = await Category.find();
        const game = await Game.findOne();
    
        const errors = {};

        if(!title || title.trim()===""){
            errors.title = 'game title is required';
            
        }
        if(!price || price.trim()===""){
            errors.price = 'game price is required';
        }else if(parseFloat(price)<=0){
            errors.price = 'price cannot be zero or negative';
        }
         if(!description || description.trim()===""){
            errors.description = 'game description is required';
        }
         if(!releaseDate || releaseDate.trim()===""){
            errors.releaseDate = 'game release date is required';
        }
        
        if(!stockQuantity || stockQuantity.trim()===""){
           errors.stockQuantity = 'game stock quantity is required';
        }else if(parseInt(stockQuantity)<=0){
            errors.stockQuantity = 'Stock quantity cannot be zero or negative';
        }
         if(!status || status.trim()===""){
            errors.status = 'game status is required';
        }
         if(!category  || category.trim()===""){
           errors.category = 'game category is required';
        }

        if(Object.keys(errors).length>0){
            return res.render('admin/addgame',{errors,game,category:categories,data:req.session.formData || {}});
        }

        // Validate files
        if (!req.files || !req.files.coverImage || !req.files.coverImage[0]) {
            console.log('Error in cover image');
            errors.coverImage = 'Cover image is required';
            return res.render('admin/addgame', {
                category: categories,
                errors: 'Cover image is required',
                data: req.session.formData || {},
                game,
            });
        }

        // Upload cover image
      
        const coverImageUpload = await uploadToCloudinary(req.files.coverImage[0].buffer, 'games/coverImages');
     

        // Upload screenshots if provided
        let screenshotsUrls = [];
        if (req.files.screenshots && req.files.screenshots.length > 0) {
            console.log('Uploading screenshots...');
            screenshotsUrls = await Promise.all(
                req.files.screenshots.map(async (screenshot) => {
                    const uploadedScreenshot = await uploadToCloudinary(screenshot.buffer, 'games/screenshots');
                    return uploadedScreenshot.secure_url;
                })
            );
        }
       

        const newGame = new Game({
            title,
            price,
            company, 
            description,
            releaseDate,
            stockQuantity,
            status,
            category,
            media: {
                coverImage: coverImageUpload.secure_url,
                screenshots: screenshotsUrls
            }
        });

        await newGame.save();
      
        res.redirect('/admin/games'); 

    } catch (error) {
        console.error('Error adding game:', error);
        res.render('admin/addgame', {
            category: await Category.find(),
            err: 'Failed to add game. Please try again.'
        });
    }
};
