import express from "express";

import { 
    getAllKecamatan, 
    getKecamatanById,
    getKecamatanByNama,
    getKecamatanByKabupatenKota
} from "../controllers/kecamatan.controller.js";

const router = express.Router();

router.get("/", getAllKecamatan);
router.get("/:id", getKecamatanById);
router.post("/nama", getKecamatanByNama);
// Route untuk mendapatkan kecamatan berdasarkan kabupaten/kota
router.get('/kabupaten-kota/:kabupatenKotaId', getKecamatanByKabupatenKota);

export default router;
