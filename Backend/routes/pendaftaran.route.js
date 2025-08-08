import express from "express";

import {
    getAllPendaftaran,
    getPendaftaranById,
    createPendaftaran,
    updatePendaftaranPendaftar,
    deletePendaftaran,
    exportToExcel,
    exportToExcelBySekolah,
    konfirmasiPenerimaan,
    getPendaftaranDiterimaBySekolah,
    getPendaftaranBelumDiterimaBySekolahZonasi,
    copyToClipboard,
    exportToCSV,
    exportToPDF,
    getPendaftaranByJalur,
    getPendaftaranBySekolahTujuan,
    getDetailPendaftaranByJalur,
    getBelumTertampung,
    getKelolaBelumTertampung,
    updateKelolaBelumTertampung,
    getPendaftaranBySekolahZonasi,
    getPendaftaranByUserId,
    updatePendaftaranByUserId,
    getTotalPendaftar,
    getTotalDiterima,
    getPendaftaranBySekolahPrestasi,
    getPendaftaranBySekolahMandiri,
    getPendaftaranBySekolahPindahan,
    uploadDokumenBaru,
    getPendaftaranBySekolahAfirmasi,
    getPendaftaranByJalurJenjang,
    cekKuotaJalur,
    getStatistikPendaftaran,
    createPendaftaranWithoutNIK,
    updatePendaftaranWithoutNIK,
    getDiterimaAll,
    getPendaftaranGrafik,
    getAllPendaftaranBySekolah
} from "../controllers/pendaftaran.controller.js";
import { verifyDinas } from "../middleware/Dinas.js";


const router = express.Router();

router.get("/", getAllPendaftaran);

// rute untuk ekspor data
router.get("/export/excel", exportToExcel);
router.get("/export/excel/sekolah/:id_sekolah_tujuan", exportToExcelBySekolah);
router.get("/export/copy", copyToClipboard);
router.get("/export/csv", exportToCSV);
router.get("/export/pdf", exportToPDF);

router.get("/diterima/sekolah/:id_sekolah_tujuan", getPendaftaranDiterimaBySekolah);
// router.get("/belum-diterima/sekolah/:id_sekolah_tujuan", getPendaftaranBelumDiterimaBySekolah);
router.get("/belum-diterima/sekolah-zonasi/:id_sekolah_tujuan", getPendaftaranBelumDiterimaBySekolahZonasi);
// rute untuk mendapatkan pendaftaran berdasarkan jalur diterima untuk sidebar diterima
router.get("/diterima-jalur", getPendaftaranByJalur);
router.get("/diterima-jalur/:jenjang", getPendaftaranByJalurJenjang);
// Contoh: /diterima-jalur/by-sekolah-tujuan/1
router.get("/diterima-jalur/by-sekolah-tujuan/:id", getPendaftaranBySekolahTujuan);
// rute untuk mendapatkan detail pendaftaran berdasarkan jalur diterima untuk sidebar diterima
// Contoh: /diterima-jalur/by-sekolah-tujuan/detail/:id_sekolah_tujuan/:id_jalur_pendaftaran
// Contoh: /diterima-jalur/by-sekolah-tujuan/detail/1/1
router.get("/diterima-jalur/by-sekolah-tujuan/detail/:id_sekolah_tujuan/:id_jalur_pendaftaran", getDetailPendaftaranByJalur);

// Route untuk mendapatkan data siswa yang belum tertampung untuk sidebar belum tertampung
// Dapat difilter berdasarkan jenis sekolah dengan params
// Contoh: /belum-tertampung/TK
// Contoh: /belum-tertampung/semua
router.get('/belum-tertampung/:jenis_sekolah?', getBelumTertampung);

// Route untuk mendapatkan data siswa yang belum tertampung untuk sidebar kelola belum tertampung
// Dapat difilter berdasarkan tingkatan, jalur pendaftaran, dan domisili
// Contoh: /kelola-belum-tertampung/112/1/1
// Contoh: /kelola-belum-tertampung/semuaTingkatan/semuaJalurPendaftaran/semuaDomisili
router.get('/kelola-belum-tertampung/:tingkatan/:jalur_pendaftaran/:domisili', getKelolaBelumTertampung);

// rute untuk update kelola belum tertampung
router.put("/kelola-belum-tertampung/:id_pendaftaran", verifyDinas, updateKelolaBelumTertampung);
 
// Endpoint untuk mendapatkan total pendaftar
router.get("/total", getTotalPendaftar);

// Endpoint untuk mendapatkan total pendaftar yang diterima
router.get("/total-diterima", getTotalDiterima);

// Endpoint untuk mendapatkan semua data siswa diterima untuk semua sekolah
router.get("/diterima-all", getDiterimaAll);

// Route untuk mendapatkan data pendaftaran berdasarkan user ID
router.get("/user/:userId", getPendaftaranByUserId);
// Route untuk update data pendaftaran berdasarkan user ID
router.put("/user/:userId", updatePendaftaranByUserId);

// Route untuk mendapatkan data profil user
router.get("/profile/:userId", getPendaftaranByUserId);
// Route untuk update data profil user
router.put("/profile/:userId", updatePendaftaranByUserId);

router.get("/:id", getPendaftaranById);
router.post("/", createPendaftaran);
router.put("/:id", updatePendaftaranPendaftar);
router.delete("/:id", verifyDinas, deletePendaftaran);
router.get("/data-pendaftar-zonasi/:id_sekolah_tujuan", getPendaftaranBySekolahZonasi);
// rute untuk konfirmasi penerimaan
// Cara penggunaan:
// Misal: /1/konfirmasi
router.put("/:id/konfirmasi", konfirmasiPenerimaan);
router.get("/data-pendaftar-prestasi/:id_sekolah_tujuan", getPendaftaranBySekolahPrestasi);

// rute untuk upload dokumen baru
router.post("/upload-dokumen-baru/:id_pendaftaran", uploadDokumenBaru);

router.get("/data-pendaftar-mandiri/:id_sekolah_tujuan", getPendaftaranBySekolahMandiri);

router.get("/data-pendaftar-pindahan/:id_sekolah_tujuan", getPendaftaranBySekolahPindahan);

router.get("/data-pendaftar-afirmasi/:id_sekolah_tujuan", getPendaftaranBySekolahAfirmasi);
// Route untuk mengecek kuota jalur pendaftaran untuk dashboard admin sekolah
router.get('/kuota/jalur/:id_jalur/:id_sekolah', cekKuotaJalur);
// Rute untuk cek kuota sekolah untuk halaman pendaftaran
router.get("/cek-kuota/:id_jalur/:id_sekolah", cekKuotaJalur);
// Route untuk mendapatkan statistik pendaftaran
router.get('/statistik/pendaftaran/:id_sekolah', getStatistikPendaftaran);
// Route untuk mencari data dapodik berdasarkan NIK dengan data wilayah
router.post("/create-without-nik", verifyDinas, createPendaftaranWithoutNIK);
router.put("/update-without-nik/:id_pendaftaran", verifyDinas, updatePendaftaranWithoutNIK);

// Endpoint untuk mendapatkan data grafik berdasarkan jenjang
router.get("/grafik/:jenjang", getPendaftaranGrafik);
// Endpoint untuk pengumuman.jsx
router.get("/data-pendaftaran-sekolah/:id_sekolah_tujuan", getAllPendaftaranBySekolah);
export default router;