import express from "express";
import { verifyDinas } from "../middleware/Dinas.js";
import {
    getAllTipeSekolah,
    getTipeSekolahById,
    searchTipeSekolah,
    createTipeSekolah,
    updateTipeSekolah,
    deleteTipeSekolah
} from "../controllers/tipe_sekolah.controller.js";

const router = express.Router();

// Route publik
router.get("/", getAllTipeSekolah);
router.get("/search", searchTipeSekolah);
router.get("/:id", getTipeSekolahById);

// Route yang memerlukan akses Dinas
router.post("/", verifyDinas, createTipeSekolah);
router.put("/:id", verifyDinas, updateTipeSekolah);
router.delete("/:id", verifyDinas, deleteTipeSekolah);

export default router;
