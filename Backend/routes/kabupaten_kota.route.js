import express from "express";

import {
    getAllKabupatenKota,
    getKabupatenKotaById,
    getKabupatenKotaByNama,
    getKabupatenKotaByProvinsi
} from "../controllers/kabupaten_kota.controller.js";

const router = express.Router();

router.get("/", getAllKabupatenKota);
router.get("/:id", getKabupatenKotaById);
router.post("/nama", getKabupatenKotaByNama);
// Route untuk mendapatkan kabupaten/kota berdasarkan provinsi
router.get('/provinsi/:provinsiId', getKabupatenKotaByProvinsi);

export default router;