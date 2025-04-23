import Game from '../models/gameModel.js';
import Category from '../models/CategoryModel.js';

// Add this new function to your existing controller
export const getAllGames = async (req, res) => {
    try {
        const games = await Game.find().populate('category');
        res.render('admin/games', { games });
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
};

export const addGame =async (req, res) => {
  try {
    const category = await Category.find()
    res.render('admin/addgame',{category}); // Render the form to add a game
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to render add game page' });
  }
};

export const postAdd = async (req, res) => {
    try {
        const { title, price, platform, description, releaseDate, stockQuantity, status, category } = req.body;
        const categories = await Category.find();

        if (!title || !price || !platform || !description || !releaseDate || !stockQuantity || !status) {
            return res.render('admin/addgame', { 
                category: categories, 
                err: 'Please fill all required fields' 
            });
        }

        const coverImage = req.files?.coverImage?.[0];
        const screenshots = req.files?.screenshots || [];

        const newGame = new Game({
            title,
            price: parseFloat(price),
            platforms: platform.split(','), // Handle multiple platforms
            description,
            releaseDate: new Date(releaseDate),
            stockQuantity: parseInt(stockQuantity),
            status,
            category,
            media: {
                coverImage: coverImage ? `/uploads/games/${coverImage.filename}` : '',
                screenshots: screenshots.map(file => `/uploads/games/${file.filename}`)
            }
        });

        await newGame.save();
        res.redirect('/admin/games');

    } catch (err) {
        console.error('Error adding game:', err);
        const categories = await Category.find();
        res.render('admin/addgame', { 
            category: categories, 
            err: 'Internal Server Error. Please try again later' 
        });
    }
};
 
