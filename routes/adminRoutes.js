import express from "express";
import { getAdminLoginPage, postAdminLogin, adminLogout } from "../controllers/adminController.js";
import { getAllCategories, postAllCategories, updateCategoryStatus,updateCategory,pagination } from "../controllers/adminCategory.js";
import { addGame, postAdd, getAllGames } from "../controllers/gameController.js";
import { getPlatFormPage } from "../controllers/platformController.js";
import isAdminAuthenticated from "../middleware/adminAuth.js";
import { getAllUsersPage,blockUser,searchUsers } from '../controllers/adminUserController.js';

import multer from "multer";
import path from "path";

const adminRoutes = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/uploads/games/"),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Auth routes
adminRoutes.get("/login", getAdminLoginPage);
adminRoutes.post("/login", postAdminLogin);
adminRoutes.get("/logout", adminLogout);

// Protected routes
// Apply middleware to all routes below
adminRoutes.use(isAdminAuthenticated); 

adminRoutes.get("/dashboard", (req, res) => {
    res.render("admin/dashboard", { name: req.session.admin.name });
});



adminRoutes.get('/users',getAllUsersPage); //middle
adminRoutes.post('/users/toggle-status',blockUser);

adminRoutes.get('/users/search',searchUsers);

// Category routes
adminRoutes.get("/category", getAllCategories);
adminRoutes.post("/category", postAllCategories);
adminRoutes.post('/category/:id',updateCategory);
adminRoutes.post("/category/:Id", updateCategoryStatus);
adminRoutes.post('/category/pagination',pagination)

adminRoutes.get("/platform", getPlatFormPage);
// adminRoutes.post("/platform", postAllCategories);
// adminRoutes.post("/platform/:id", updateCategoryStatus);
adminRoutes.get('/games',getAllGames)

// Game routes
adminRoutes.get("/games", getAllGames);
adminRoutes.get("/addgame", addGame);
adminRoutes.post("/addgame", upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "screenshots", maxCount: 5 }
]), postAdd);

export default adminRoutes;
