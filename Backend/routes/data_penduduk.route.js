import express from "express";
import {
    getAllDataPenduduk,
    getDataPendudukById,
    getDataPendudukByNik,
    searchDataPenduduk,
    createDataPenduduk,
    updateDataPenduduk,
    deleteDataPenduduk
} from "../controllers/data_penduduk.controller.js";

const router = express.Router();

// Route untuk mendapatkan semua data penduduk
router.get('/', getAllDataPenduduk);

// Route untuk mencari data penduduk berdasarkan NIK atau NISN
router.get('/search', searchDataPenduduk);

// Route untuk mencari data penduduk berdasarkan NIK
router.get('/nik/:nik', getDataPendudukByNik);

// Route untuk mendapatkan data penduduk berdasarkan ID
router.get('/:id', getDataPendudukById);

// Route untuk membuat data penduduk baru
router.post('/', createDataPenduduk);

// Route untuk mengupdate data penduduk
router.put('/:id', updateDataPenduduk);

// Route untuk menghapus data penduduk
router.delete('/:id', deleteDataPenduduk);

export default router;
