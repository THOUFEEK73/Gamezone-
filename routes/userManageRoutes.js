import express from 'express';
import { getAllUsersPage,blockUser } from '../controllers/adminUserController.js';
const userManageRoutes = express.Router();



userManageRoutes.get('/admin/users',getAllUsersPage);
userManageRoutes.post('/admin/users/toggle-status',blockUser);


export default userManageRoutes;