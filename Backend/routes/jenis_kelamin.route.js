import express from "express";
import {
    getAllJenisKelamin,
    getJenisKelaminById,
    createJenisKelamin,
    updateJenisKelamin,
    deleteJenisKelamin
} from "../controllers/jenis_kelamin.controller.js";

const router = express.Router();

// Route untuk mendapatkan semua jenis kelamin
router.get("/", getAllJenisKelamin);

// Route untuk mendapatkan jenis kelamin berdasarkan ID
router.get("/:id", getJenisKelaminById);

// Route untuk membuat jenis kelamin baru
router.post("/", createJenisKelamin);

// Route untuk mengupdate jenis kelamin
router.put("/:id", updateJenisKelamin);

// Route untuk menghapus jenis kelamin
router.delete("/:id", deleteJenisKelamin);

export default router;
