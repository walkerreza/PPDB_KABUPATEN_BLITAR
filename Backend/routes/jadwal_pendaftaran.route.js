import express from "express";
import {
    getAllJadwal,
    getJadwalById,
    createJadwal,
    updateJadwal,
    deleteJadwal,
    searchJadwal,
    getJadwalSistemById
} from "../controllers/jadwal_pendaftaran.controller.js";
import { verifyDinas } from "../middleware/Dinas.js";

const router = express.Router();

// Route untuk mendapatkan semua jadwal pendaftaran
router.get("/",  getAllJadwal);

// Route untuk membuat jadwal pendaftaran baru
router.post("/", verifyDinas, createJadwal);

// Route untuk mengupdate jadwal pendaftaran
router.put("/:id", verifyDinas, updateJadwal);

// Route untuk menghapus jadwal pendaftaran
router.delete("/:id", verifyDinas, deleteJadwal);

// Route untuk mencari jadwal pendaftaran
router.get("/search", searchJadwal);

// Route untuk mendapatkan jadwal pendaftaran berdasarkan ID
router.get("/:id", getJadwalById);

// Route untuk mendapatkan status jadwal sistem berdasarkan ID
router.get("/jadwal-sistem/:id", getJadwalSistemById);

export default router;
