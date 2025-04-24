import express from "express";
import { getAdminLoginPage, postAdminLogin, adminLogout } from "../controllers/adminController.js";
import { getAllCategories, postAllCategories, updateCategoryStatus } from "../controllers/adminCategory.js";
import { addGame, postAdd, getAllGames } from "../controllers/gameController.js";
import isAdminAuthenticated from "../middleware/adminAuth.js";
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
adminRoutes.use(isAdminAuthenticated); // Apply middleware to all routes below

adminRoutes.get("/dashboard", (req, res) => {
    res.render("admin/dashboard", { name: req.session.admin.name });
});

// Category routes
adminRoutes.get("/category", getAllCategories);
adminRoutes.post("/category", postAllCategories);
adminRoutes.post("/category/:id", updateCategoryStatus);
adminRoutes.get('/games',getAllGames)

// Game routes
adminRoutes.get("/games", getAllGames);
adminRoutes.get("/addgame", addGame);
adminRoutes.post("/addgame", upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "screenshots", maxCount: 5 }
]), postAdd);

export default adminRoutes;
