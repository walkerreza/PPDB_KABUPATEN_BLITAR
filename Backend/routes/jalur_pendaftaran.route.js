import express from "express";
import { verifyDinas } from "../middleware/Dinas.js";

import {
    getAllJalur,
    getJalurById,
    createJalur,
    updateJalur,
    deleteJalur
} from "../controllers/jalur_pendaftaran.controller.js";

const router = express.Router();

// Route untuk mendapatkan semua jalur pendaftaran
router.get("/", getAllJalur);

// Route untuk mendapatkan jalur pendaftaran berdasarkan ID
router.get("/:id", getJalurById);

// Route untuk membuat jalur pendaftaran baru
router.post("/", verifyDinas, createJalur);

// Route untuk mengupdate jalur pendaftaran
router.put("/:id", verifyDinas, updateJalur);

// Route untuk menghapus jalur pendaftaran
router.delete("/:id", verifyDinas, deleteJalur);

export default router;
