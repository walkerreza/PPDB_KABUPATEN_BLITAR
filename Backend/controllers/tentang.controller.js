import Tentang from "../models/tentang.model.js";

/**
 * Controller untuk mengelola data tentang
 */

// Mendapatkan semua data tentang
export const getAllTentang = async (req, res) => {
    try {
        const tentang = await Tentang.findAll({
            order: [['id_tentang', 'DESC']]
        });
        res.json(tentang);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data tentang"
        });
    }
};

// Mendapatkan data tentang berdasarkan ID
export const getTentangById = async (req, res) => {
    try {
        const tentang = await Tentang.findByPk(req.params.id);
        if (!tentang) {
            return res.status(404).json({
                message: "Data tentang tidak ditemukan"
            });
        }
        res.json(tentang);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data tentang"
        });
    }
};

// Membuat data tentang baru
export const createTentang = async (req, res) => {
    try {
        const { judul, deskripsi, status } = req.body;

        // Validasi input
        if (!judul || !deskripsi) {
            return res.status(400).json({
                message: "judul dan deskripsi harus diisi"
            });
        }

        const tentang = await Tentang.create({
            judul,
            deskripsi,
            status: status || 1 // default aktif
        });

        res.status(201).json({
            message: "Data tentang berhasil dibuat",
            data: tentang
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal membuat data tentang"
        });
    }
};

// Mengupdate data tentang
export const updateTentang = async (req, res) => {
    try {
        const tentang = await Tentang.findByPk(req.params.id);
        if (!tentang) {
            return res.status(404).json({
                message: "Data tentang tidak ditemukan"
            });
        }

        const { judul, deskripsi, status } = req.body;

        await tentang.update({
            judul: judul || tentang.judul,
            deskripsi: deskripsi || tentang.deskripsi,
            status: status !== undefined ? status : tentang.status
        });

        res.json({
            message: "Data tentang berhasil diupdate",
            data: tentang
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengupdate data tentang"
        });
    }
};

// Menghapus data tentang
export const deleteTentang = async (req, res) => {
    try {
        const tentang = await Tentang.findByPk(req.params.id);
        if (!tentang) {
            return res.status(404).json({
                message: "Data tentang tidak ditemukan"
            });
        }

        await tentang.destroy();
        res.json({
            message: "Data tentang berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal menghapus data tentang"
        });
    }
};