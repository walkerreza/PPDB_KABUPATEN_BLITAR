import TipeSekolah from "../models/tipe_sekolah.model.js";
import { Op } from "sequelize";

/**
 * Mendapatkan semua data tipe sekolah
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const getAllTipeSekolah = async (req, res) => {
    try {
        const tipeSekolah = await TipeSekolah.findAll({
            order: [['id_tipe_sekolah', 'ASC']] // Urutkan berdasarkan nama
        });

        res.json({
            message: "Berhasil mendapatkan data tipe sekolah",
            data: tipeSekolah
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mendapatkan data tipe sekolah",
            error: error.message
        });
    }
};

/**
 * Mendapatkan data tipe sekolah berdasarkan ID
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const getTipeSekolahById = async (req, res) => {
    try {
        const tipeSekolah = await TipeSekolah.findByPk(req.params.id);
        
        if (!tipeSekolah) {
            return res.status(404).json({
                message: "Tipe sekolah tidak ditemukan"
            });
        }

        res.json({
            message: "Berhasil mendapatkan detail tipe sekolah",
            data: tipeSekolah
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mendapatkan detail tipe sekolah",
            error: error.message
        });
    }
};

/**
 * Mencari tipe sekolah berdasarkan nama atau slug
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const searchTipeSekolah = async (req, res) => {
    try {
        const { keyword } = req.query;

        const tipeSekolah = await TipeSekolah.findAll({
            where: {
                [Op.or]: [
                    { nama: { [Op.like]: `%${keyword}%` } },
                    { slug: { [Op.like]: `%${keyword}%` } }
                ]
            },
            order: [['nama', 'ASC']]
        });

        res.json({
            message: "Berhasil mencari tipe sekolah",
            data: tipeSekolah
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mencari tipe sekolah",
            error: error.message
        });
    }
};

/**
 * Membuat tipe sekolah baru
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const createTipeSekolah = async (req, res) => {
    try {
        const { id_tipe_sekolah, slug, nama } = req.body;

        // Validasi input
        if (!id_tipe_sekolah || !slug || !nama) {
            return res.status(400).json({
                message: "ID, slug, dan nama harus diisi"
            });
        }

        // Cek apakah ID sudah ada
        const existingId = await TipeSekolah.findByPk(id_tipe_sekolah);
        if (existingId) {
            return res.status(400).json({
                message: "ID tipe sekolah sudah digunakan"
            });
        }

        // Cek apakah slug sudah ada
        const existingSlug = await TipeSekolah.findOne({ where: { slug } });
        if (existingSlug) {
            return res.status(400).json({
                message: "Slug sudah digunakan"
            });
        }

        const tipeSekolah = await TipeSekolah.create({
            id_tipe_sekolah,
            slug,
            nama
        });

        res.status(201).json({
            message: "Berhasil membuat tipe sekolah baru",
            data: tipeSekolah
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal membuat tipe sekolah baru",
            error: error.message
        });
    }
};

/**
 * Mengupdate data tipe sekolah
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const updateTipeSekolah = async (req, res) => {
    try {
        const { slug, nama } = req.body;
        const id = req.params.id;

        // Validasi input
        if (!slug || !nama) {
            return res.status(400).json({
                message: "Slug dan nama harus diisi"
            });
        }

        // Cek apakah tipe sekolah ada
        const tipeSekolah = await TipeSekolah.findByPk(id);
        if (!tipeSekolah) {
            return res.status(404).json({
                message: "Tipe sekolah tidak ditemukan"
            });
        }

        // Cek apakah slug sudah digunakan oleh record lain
        const existingSlug = await TipeSekolah.findOne({
            where: {
                slug,
                id_tipe_sekolah: { [Op.ne]: id }
            }
        });
        if (existingSlug) {
            return res.status(400).json({
                message: "Slug sudah digunakan"
            });
        }

        // Update data
        await tipeSekolah.update({
            slug,
            nama
        });

        res.json({
            message: "Berhasil mengupdate tipe sekolah",
            data: tipeSekolah
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengupdate tipe sekolah",
            error: error.message
        });
    }
};

/**
 * Menghapus tipe sekolah
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const deleteTipeSekolah = async (req, res) => {
    try {
        const id = req.params.id;

        // Cek apakah tipe sekolah ada
        const tipeSekolah = await TipeSekolah.findByPk(id);
        if (!tipeSekolah) {
            return res.status(404).json({
                message: "Tipe sekolah tidak ditemukan"
            });
        }

        // Hapus data
        await tipeSekolah.destroy();

        res.json({
            message: "Berhasil menghapus tipe sekolah"
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal menghapus tipe sekolah",
            error: error.message
        });
    }
};