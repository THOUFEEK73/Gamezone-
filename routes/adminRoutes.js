import express from "express";
import path from "path";
import multer from "multer";

import { 
  getAdminLoginPage, postAdminLogin, adminLogout 
} from "../controllers/adminController.js";

import { 
  getAllCategories, postAllCategories, updateCategoryStatus, updateCategory 
} from "../controllers/adminCategory.js";

import { 
  addGame, postGameDetails, getAllGames 
} from "../controllers/gameController.js";

import { getPlatFormPage } from "../controllers/platformController.js";

import { 
  getAllUsersPage, blockUser, searchUsers 
} from '../controllers/adminUserController.js';

import {
  getCompanyPage,addGameCompany,toggleCompanyStatus,editCompany

} from '../controllers/gameCompany.js';

import {
  getOrdersPage,postOrderStatus,getOrderDetailPage,updateReturnStatus
} from '../controllers/adminOrderManagement.js';

import isAdminAuthenticated from "../middleware/adminAuth.js";
import upload from '../middleware/multerMiddleWare.js';
import Category from "../models/CategoryModel.js";
import {editGamePage,postEditGame} from "../controllers/editGameController.js"
import Game from "../models/gameModel.js";
import noCache from "../middleware/Cache-Control.js";
import flash from 'connect-flash';





const adminRoutes = express.Router();
adminRoutes.use(noCache);
// Public routes
adminRoutes.get("/login",noCache, getAdminLoginPage);
adminRoutes.post("/login",noCache, postAdminLogin);


adminRoutes.use(isAdminAuthenticated);
adminRoutes.use(flash());
// Logout route
adminRoutes.get("/logout", adminLogout);

// Dashboard
adminRoutes.get("/dashboard", (req, res) => {
  res.render("admin/dashboard", { name: req.session.admin.name });
});

// User management
adminRoutes.get('/users', getAllUsersPage);
adminRoutes.post('/users/toggle-status', blockUser);
adminRoutes.get('/users/search', searchUsers);

// Category management
adminRoutes.get("/category", getAllCategories);
adminRoutes.post("/category/aa", postAllCategories);
adminRoutes.post('/category/update/:id', updateCategory);
adminRoutes.post("/category/:Id", updateCategoryStatus);

adminRoutes.get('/orders',getOrdersPage)
adminRoutes.post('/orders/:orderId/item/:itemId/status',postOrderStatus)
adminRoutes.get('/UserorderDetail/:id',getOrderDetailPage)

adminRoutes.post('/orders/:orderId/item/:itemId/return',updateReturnStatus)



adminRoutes.get('/editgame/:id',editGamePage);
// adminRoutes.post('/editgame/:id',postEditGame);
adminRoutes.post("/editgame/:id",
  async (req, res, next) => {
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        const categories = await Category.find(); // Fetch categories again
        return res.render('admin/addgame', {
          category: categories,
          err: 'Error uploading files: ' + err.message
        });
      } else if (err) {
        // An unknown error occurred
        console.error('Unknown error during file upload:', err);
        const categories = await Category.find(); // Fetch categories again
        return res.render('admin/addgame', {
          category: categories,
          err: 'An error occurred while uploading files'
        });
      }
     
      next();
    });
  },
  postEditGame
);
// Platform management
adminRoutes.get("/platform", getPlatFormPage);

// adminRotues.get('/allgames',isAthenticated,showAllGames)
// adminRoutes.get('/gamedetail/:id',isAthenticated,getDetailPage);


// Game management
adminRoutes.get("/games", getAllGames);
adminRoutes.post("/games/:id/toggle-status", async (req, res) => {
  try {
    console.log('toggle triggered')
    const gameId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    // Update the game status in the database
    const updatedGame = await Game.findByIdAndUpdate(
      gameId, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!updatedGame) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Game status updated successfully',
      game: updatedGame
    });
  } catch (error) {
    console.error('Error updating game status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update game status' 
    });
  }
});
adminRoutes.get("/addgame", addGame);
adminRoutes.post("/addgame",
  async (req, res, next) => {
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        const categories = await Category.find(); // Fetch categories again
        return res.render('admin/addgame', {
          category: categories,
          err: 'Error uploading files: ' + err.message
        });
      } else if (err) {
        // An unknown error occurred
        console.error('Unknown error during file upload:', err);
        const categories = await Category.find(); // Fetch categories again
        return res.render('admin/addgame', {
          category: categories,
          err: 'An error occurred while uploading files'
        });
      }
      // Everything went fine
      next();
    });
  },
  postGameDetails
);




adminRoutes.get('/company',getCompanyPage);
adminRoutes.post('/companies',addGameCompany)
adminRoutes.post('/company/edit/:id',editCompany)
adminRoutes.post('/company/toggle/:id',toggleCompanyStatus);
// adminRoutes.post('/company/edit/:id',editCompany);
// router.post('/company/toggle/:id',toggleCom)


export default adminRoutes;
