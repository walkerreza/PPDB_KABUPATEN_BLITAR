import express from "express";
import { verifyDinas } from '../middleware/Dinas.js';

import {
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    searchNewsTicker
} from "../controllers/news_ticker.controller.js";

const router = express.Router();

// Route untuk mendapatkan semua news ticker
router.get("/", getAllNews);

// Route untuk mencari news ticker berdasarkan judul
router.get("/search", searchNewsTicker);

// Route untuk mendapatkan news ticker berdasarkan ID
router.get("/:id", getNewsById);

// Route untuk membuat news ticker baru
router.post("/", verifyDinas, createNews);

// Route untuk mengupdate news ticker
router.put("/:id", verifyDinas, updateNews);

// Route untuk menghapus news ticker
router.delete("/:id", verifyDinas, deleteNews);

export default router;
