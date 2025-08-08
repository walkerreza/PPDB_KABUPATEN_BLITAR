import express from "express";

import { 
    getAllKelurahan, 
    getKelurahanById,
    getKelurahanByNama,
    getKelurahanByKecamatan
} from "../controllers/kelurahan.controller.js";

const router = express.Router();

router.get("/", getAllKelurahan);
router.get("/:id", getKelurahanById);
router.post("/nama", getKelurahanByNama);
// Route untuk mendapatkan kelurahan berdasarkan kecamatan
router.get('/kecamatan/:kecamatanId', getKelurahanByKecamatan);

export default router;
