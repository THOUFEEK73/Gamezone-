import express from 'express';
import {showAllGames,getDetailPage} from '../controllers/gameDetail.js'
import isAthenticated from '../middleware/auth.js';
const userRoutes = express.Router();




userRoutes.get('/allgames',isAthenticated,showAllGames)
userRoutes.get('/gamedetail/:id',isAthenticated,getDetailPage);


export default userRoutes