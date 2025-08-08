import JenisKelamin from "../models/jenis_kelamin.model.js";

/**
 * Controller untuk mengelola jenis kelamin
 */

// Mendapatkan semua jenis kelamin
export const getAllJenisKelamin = async (req, res) => {
    try {
        const jenisKelamin = await JenisKelamin.findAll({
            order: [['id_jenis_kelamin', 'ASC']]
        });
        res.json(jenisKelamin);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data jenis kelamin"
        });
    }
};

// Mendapatkan jenis kelamin berdasarkan ID
export const getJenisKelaminById = async (req, res) => {
    try {
        const jenisKelamin = await JenisKelamin.findByPk(req.params.id);
        if (!jenisKelamin) {
            return res.status(404).json({
                message: "Jenis kelamin tidak ditemukan"
            });
        }
        res.json(jenisKelamin);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data jenis kelamin"
        });
    }
};

// Membuat jenis kelamin baru
export const createJenisKelamin = async (req, res) => {
    try {
        const { nama } = req.body;

        // Validasi input
        if (!nama) {
            return res.status(400).json({
                message: "Nama harus diisi"
            });
        }

        const jenisKelamin = await JenisKelamin.create({
            nama
        });

        res.status(201).json({
            message: "Jenis kelamin berhasil dibuat",
            data: jenisKelamin
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal membuat jenis kelamin"
        });
    }
};

// Mengupdate jenis kelamin
export const updateJenisKelamin = async (req, res) => {
    try {
        const jenisKelamin = await JenisKelamin.findByPk(req.params.id);
        if (!jenisKelamin) {
            return res.status(404).json({
                message: "Jenis kelamin tidak ditemukan"
            });
        }

        const { nama } = req.body;

        await jenisKelamin.update({
            nama: nama || jenisKelamin.nama
        });

        res.json({
            message: "Jenis kelamin berhasil diupdate",
            data: jenisKelamin
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengupdate jenis kelamin"
        });
    }
};

// Menghapus jenis kelamin
export const deleteJenisKelamin = async (req, res) => {
    try {
        const jenisKelamin = await JenisKelamin.findByPk(req.params.id);
        if (!jenisKelamin) {
            return res.status(404).json({
                message: "Jenis kelamin tidak ditemukan"
            });
        }

        await jenisKelamin.destroy();
        res.json({
            message: "Jenis kelamin berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal menghapus jenis kelamin"
        });
    }
};