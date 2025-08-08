import express from 'express';
import { login, logout } from '../controllers/login.controller.js';
import { verifyToken } from '../middleware/VerifyToken.js';

const router = express.Router();

// Route untuk login
router.post('/', login);

// Route untuk logout (perlu token)
router.post('/logout', verifyToken, logout);

export default router;
