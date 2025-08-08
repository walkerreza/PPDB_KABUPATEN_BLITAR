import express from "express";

import {
    getAllSekolah,
    getSekolahById,
    createSekolah,
    updateSekolah,
    deleteSekolah,
    searchSekolah,
    getSekolahByTipe,
    getSekolahByWilayah,
    updatePaguSekolah,
    getTotalSekolah,
    getSekolahByJenjang
} from "../controllers/sekolah.controller.js";

const router = express.Router();

// Route untuk operasi dasar
router.get("/", getAllSekolah);
router.post("/", createSekolah);

// Route untuk pencarian dan filter
router.get("/search", searchSekolah);
router.get("/tipe/:tipeId", getSekolahByTipe);
router.get("/wilayah", getSekolahByWilayah);
router.get("/jenjang/:jenjang", getSekolahByJenjang);

// Route untuk update pagu
router.put("/pagu", updatePaguSekolah);

// Get total sekolah
router.get('/total', getTotalSekolah);

// Route dengan parameter id harus di akhir
router.get("/:id", getSekolahById);
router.put("/:id", updateSekolah);
router.delete("/:id", deleteSekolah);

export default router;