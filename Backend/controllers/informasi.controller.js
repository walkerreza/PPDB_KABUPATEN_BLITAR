import Informasi from "../models/informasi.model.js";

/**
 * Controller untuk mengelola informasi
 */

// Mendapatkan semua informasi
export const getAllInformasi = async (req, res) => {
    try {
        const informasi = await Informasi.findAll({
            order: [['id_informasi', 'DESC']]
        });
        res.json(informasi);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data informasi"
        });
    }
};

// Mendapatkan informasi aktif
export const getActiveInformasi = async (req, res) => {
    try {
        const informasi = await Informasi.findAll({
            where: {
                status: 1
            },
            order: [['id_informasi', 'DESC']]
        });
        res.json(informasi);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data informasi aktif"
        });
    }
};

// Mendapatkan informasi berdasarkan ID
export const getInformasiById = async (req, res) => {
    try {
        const informasi = await Informasi.findByPk(req.params.id);
        if (!informasi) {
            return res.status(404).json({
                message: "Informasi tidak ditemukan"
            });
        }
        res.json(informasi);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data informasi"
        });
    }
};

// Membuat informasi baru
export const createInformasi = async (req, res) => {
    try {
        const { judul, deskripsi, status } = req.body;

        // Validasi input
        if (!judul || !deskripsi) {
            return res.status(400).json({
                message: "Judul dan deskripsi harus diisi"
            });
        }

        const informasi = await Informasi.create({
            judul,
            deskripsi,
            status: status || 1 // default aktif
        });

        res.status(201).json({
            message: "Informasi berhasil dibuat",
            data: informasi
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal membuat informasi"
        });
    }
};

// Mengupdate informasi
export const updateInformasi = async (req, res) => {
    try {
        const informasi = await Informasi.findByPk(req.params.id);
        if (!informasi) {
            return res.status(404).json({
                message: "Informasi tidak ditemukan"
            });
        }

        const { judul, deskripsi, status } = req.body;

        await informasi.update({
            judul: judul || informasi.judul,
            deskripsi: deskripsi || informasi.deskripsi,
            status: status !== undefined ? status : informasi.status
        });

        res.json({
            message: "Informasi berhasil diupdate",
            data: informasi
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengupdate informasi"
        });
    }
};

// Menghapus informasi
export const deleteInformasi = async (req, res) => {
    try {
        const informasi = await Informasi.findByPk(req.params.id);
        if (!informasi) {
            return res.status(404).json({
                message: "Informasi tidak ditemukan"
            });
        }

        await informasi.destroy();
        res.json({
            message: "Informasi berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal menghapus informasi"
        });
    }
};