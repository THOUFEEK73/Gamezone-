import express from 'express';
import {getDetailPage} from '../controllers/gameDetail.js'
import isAthenticated from '../middleware/auth.js';
const gameDetailRoutes = express.Router();





gameDetailRoutes.get('/gamedetail/:id',isAthenticated,getDetailPage);

export default gameDetailRoutes