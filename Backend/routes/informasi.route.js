import express from "express";
import { verifyDinas } from '../middleware/Dinas.js';

import {
    getAllInformasi,
    getActiveInformasi,
    getInformasiById,
    createInformasi,
    updateInformasi,
    deleteInformasi
} from "../controllers/informasi.controller.js";

const router = express.Router();

// Route untuk mendapatkan semua informasi
router.get("/", getAllInformasi);

// Route untuk mendapatkan informasi yang aktif
router.get("/active", getActiveInformasi);

// Route untuk mendapatkan informasi berdasarkan ID
router.get("/:id", getInformasiById);

// Route untuk membuat informasi baru
router.post("/", verifyDinas, createInformasi);

// Route untuk mengupdate informasi
router.put("/:id", verifyDinas, updateInformasi);

// Route untuk menghapus informasi
router.delete("/:id", verifyDinas, deleteInformasi);

export default router;
