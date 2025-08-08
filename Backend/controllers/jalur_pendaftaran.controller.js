import JalurPendaftaran from "../models/jalur_pendaftaran.model.js";

/**
 * Controller untuk mengelola jalur pendaftaran
 */

// Mendapatkan semua jalur pendaftaran
export const getAllJalur = async (req, res) => {
    try {
        const jalur = await JalurPendaftaran.findAll({
            order: [['id_jalur_pendaftaran', 'DESC']]
        });
        res.json(jalur);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data jalur pendaftaran"
        });
    }
};

// Mendapatkan jalur pendaftaran berdasarkan ID
export const getJalurById = async (req, res) => {
    try {
        const jalur = await JalurPendaftaran.findByPk(req.params.id);
        if (!jalur) {
            return res.status(404).json({
                message: "Jalur pendaftaran tidak ditemukan"
            });
        }
        res.json(jalur);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data jalur pendaftaran"
        });
    }
};

// Membuat jalur pendaftaran baru
export const createJalur = async (req, res) => {
    try {
        const { nama, deskripsi, status } = req.body;

        // Validasi input
        if (!nama || !deskripsi ) {
            return res.status(400).json({
                message: "Nama dan deskripsi harus diisi"
            });
        }

        const jalur = await JalurPendaftaran.create({
            nama,
            deskripsi,
            status: status || 1 // default aktif
        });

        res.status(201).json({
            message: "Jalur pendaftaran berhasil dibuat",
            data: jalur
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal membuat jalur pendaftaran"
        });
    }
};

// Mengupdate jalur pendaftaran
export const updateJalur = async (req, res) => {
    try {
        const jalur = await JalurPendaftaran.findByPk(req.params.id);
        if (!jalur) {
            return res.status(404).json({
                message: "Jalur pendaftaran tidak ditemukan"
            });
        }

        const { nama, deskripsi, status } = req.body;

        await jalur.update({
            nama: nama || jalur.nama,
            deskripsi: deskripsi || jalur.deskripsi,            
            status: status !== undefined ? status : jalur.status
        });

        res.json({
            message: "Jalur pendaftaran berhasil diupdate",
            data: jalur
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengupdate jalur pendaftaran"
        });
    }
};

// Menghapus jalur pendaftaran
export const deleteJalur = async (req, res) => {
    try {
        const jalur = await JalurPendaftaran.findByPk(req.params.id);
        if (!jalur) {
            return res.status(404).json({
                message: "Jalur pendaftaran tidak ditemukan"
            });
        }

        await jalur.destroy();
        res.json({
            message: "Jalur pendaftaran berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal menghapus jalur pendaftaran"
        });
    }
};