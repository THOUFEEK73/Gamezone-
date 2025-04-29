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

import isAdminAuthenticated from "../middleware/adminAuth.js";
import upload from '../middleware/multerMiddleWare.js';
import Category from "../models/CategoryModel.js";

const adminRoutes = express.Router();

// Public routes
adminRoutes.get("/login", getAdminLoginPage);
adminRoutes.post("/login", postAdminLogin);

// Middleware to protect all routes below
adminRoutes.use(isAdminAuthenticated);

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

// Platform management
adminRoutes.get("/platform", getPlatFormPage);

// Game management
adminRoutes.get("/games", getAllGames);
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
export default adminRoutes;
