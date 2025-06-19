import express from "express";
import path from "path";
import multer from "multer";
import noCache from "../middleware/Cache-Control.js";
import flash from 'connect-flash';
import isAdminAuthenticated from "../middleware/adminAuth.js";
import upload from '../middleware/multerMiddleWare.js';
import Category from "../models/CategoryModel.js";
import Game from "../models/gameModel.js";

// Import controllers
import { 
  getAdminLoginPage, 
  postAdminLogin, 
  adminLogout 
} from "../controllers/adminController.js";

import { 
  getAllCategories, 
  postAllCategories, 
  updateCategoryStatus, 
  updateCategory 
} from "../controllers/adminCategory.js";

import { 
  addGame, 
  postGameDetails, 
  getAllGames 
} from "../controllers/gameController.js";

import { 
  editGamePage, 
  postEditGame 
} from "../controllers/editGameController.js";

import { getPlatFormPage } from "../controllers/platformController.js";

import { 
  getAllUsersPage, 
  blockUser, 
  searchUsers 
} from '../controllers/adminUserController.js';

import {
  getCompanyPage,
  addGameCompany,
  toggleCompanyStatus,
  editCompany
} from '../controllers/gameCompany.js';

import {
  getOrdersPage,
  searchOrders,
  postOrderStatus,
  getOrderDetail,
  updateReturnStatus
} from '../controllers/adminOrderManagement.js';

import {
  getOfferPage,createOffer,
  toggleOfferStatus,postUpdateOffer
} from '../controllers/admiinOfferManagement.js';

import {
  getCouponPage,postCoupon,
  CouponStatus,updateCoupon,
} from '../controllers/adminCouponManagement.js';
import Coupon from "../models/couponModel.js";

import {
  getSalesReportPage
} from '../controllers/salesReportController.js';

import {
  downloadSalesReportExcel,downloadSalesReportPDF,
} from '../utils/downloadSalesReports.js';

import{
  getDashBoardPage,getDashBoardFilter,

} from '../controllers/adminDashboardMangement.js';
const adminRoutes = express.Router();

// Middleware
adminRoutes.use(noCache);
adminRoutes.use(flash());

// Auth Routes (Public)
adminRoutes.get("/login", noCache, getAdminLoginPage);
adminRoutes.post("/login", noCache, postAdminLogin);

// Protected Routes
adminRoutes.use(isAdminAuthenticated);

// Dashboard

adminRoutes.get('/dashboard',getDashBoardPage);
adminRoutes.get('/dashboard-filter',getDashBoardFilter)
// adminRoutes.get('/dashboard/top-products',getTop10Products);

// User Management
adminRoutes.get('/users', getAllUsersPage);
adminRoutes.post('/users/toggle-status', blockUser);
adminRoutes.get('/users/search', searchUsers);

// Category Management
adminRoutes.get("/category", getAllCategories);
adminRoutes.post("/category/aa", postAllCategories);
adminRoutes.post('/category/update/:id', updateCategory);
adminRoutes.post("/category/:Id", updateCategoryStatus);

// Order Management
adminRoutes.get('/orders', getOrdersPage);
adminRoutes.get('/orders/search', searchOrders);
adminRoutes.get('/Userorderdetail/:id', getOrderDetail);
adminRoutes.post('/orders/:orderId/item/:itemId/status', postOrderStatus);
adminRoutes.post('/orders/:orderId/item/:itemId/return', updateReturnStatus);

// Game Management
adminRoutes.get("/games", getAllGames);
adminRoutes.get("/addgame", addGame);
adminRoutes.get('/editgame/:id', editGamePage);

// Game Status Update
adminRoutes.post("/games/:id/toggle-status", async (req, res) => {
  try {
    const gameId = req.params.id;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

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

// Game Upload Routes with Multer
adminRoutes.post("/addgame", upload, postGameDetails);
adminRoutes.post("/editgame/:id", upload, postEditGame);

// Platform Management
adminRoutes.get("/platform", getPlatFormPage);

// Company Management
adminRoutes.get('/company', getCompanyPage);
adminRoutes.post('/companies', addGameCompany);
adminRoutes.post('/company/edit/:id', editCompany);
adminRoutes.post('/company/toggle/:id', toggleCompanyStatus);


// Offer Management
adminRoutes.get('/offers',getOfferPage);
adminRoutes.post('/offers/add',createOffer)
adminRoutes.post('/offers/update',postUpdateOffer);
adminRoutes.patch('/offers/toggle/:offerId',toggleOfferStatus)


// coupon Management

adminRoutes.get('/coupons',getCouponPage);
adminRoutes.post('/coupons/add',postCoupon);
adminRoutes.patch('/coupons/toggleStatus/:id',CouponStatus)
adminRoutes.patch('/coupons/update/:id',updateCoupon)

// Sales Report

adminRoutes.get('/salesReport',getSalesReportPage);
adminRoutes.get('/salesReport/excel', downloadSalesReportExcel);
adminRoutes.get('/salesReport/pdf', downloadSalesReportPDF);

// Logout
adminRoutes.get("/logout", adminLogout);

export default adminRoutes;