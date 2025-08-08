import Banner from "../models/banner.model.js";
import fs from 'fs';
import path from 'path';
import { Op } from "sequelize";
import Sequelize from 'sequelize';

/**
 * Controller untuk mengelola banner
 */

// Mendapatkan semua banner
export const getAllBanner = async (req, res) => {
    try {
        const banners = await Banner.findAll({
            order: [['id_banner', 'DESC']]
        });
        res.json(banners);
    } catch (error) {
        console.error('Error in getAllBanner:', error);
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data banner"
        });
    }
};

// Search banner by judul
export const searchBanner = async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search) {
            return res.status(400).json({
                message: "Kata kunci pencarian harus diisi"
            });
        }

        const banners = await Banner.findAll({
            where: {
                judul: Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('judul')),
                    'LIKE',
                    '%' + search.toLowerCase() + '%'
                )
            },
            order: [['id_banner', 'DESC']]
        });

        res.json(banners);
    } catch (error) {
        console.error('Error in searchBanner:', error);
        res.status(500).json({
            message: error.message,
            error: "Gagal melakukan pencarian banner"
        });
    }
};

// Mendapatkan banner berdasarkan ID
export const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) {
            return res.status(404).json({
                message: "Banner tidak ditemukan"
            });
        }
        res.json(banner);
    } catch (error) {
        console.error('Error in getBannerById:', error);
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data banner"
        });
    }
};

// Membuat banner baru
export const createBanner = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        // Validasi file
        if (!req.file) {
            return res.status(400).json({
                message: "Gambar harus diupload"
            });
        }

        // Validasi judul
        if (!req.body.judul) {
            // Hapus file jika validasi gagal
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: "Judul banner harus diisi"
            });
        }

        const banner = await Banner.create({
            judul: req.body.judul,
            // Menyimpan path gambar tanpa /api/banner di depannya
            gambar: `/content/images/banner/${req.file.filename}`,
            status: req.body.status === '1' || req.body.status === 1 ? 1 : 0
        });

        console.log('Banner created:', banner);

        res.status(201).json({
            message: "Banner berhasil dibuat",
            data: banner
        });
    } catch (error) {
        console.error('Error in createBanner:', error);
        // Hapus file jika gagal
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        res.status(500).json({
            message: error.message,
            error: "Gagal membuat banner"
        });
    }
};

// Mengupdate banner
export const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) {
            return res.status(404).json({
                message: "Banner tidak ditemukan"
            });
        }

        // Simpan path gambar lama
        const oldImagePath = banner.gambar;

        // Update data
        banner.judul = req.body.judul || banner.judul;
        banner.status = req.body.status === '1' || req.body.status === 1 ? 1 : 0;

        // Jika ada file baru
        if (req.file) {
            banner.gambar = `/content/images/banner/${req.file.filename}`;
            // Hapus gambar lama
            try {
                const fullPath = path.join(process.cwd(), oldImagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (error) {
                console.error('Error deleting old image:', error);
            }
        }

        await banner.save();

        res.json({
            message: "Banner berhasil diupdate",
            data: banner
        });
    } catch (error) {
        console.error('Error in updateBanner:', error);
        // Hapus file baru jika gagal
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        res.status(500).json({
            message: error.message,
            error: "Gagal mengupdate banner"
        });
    }
};

// Menghapus banner
export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) {
            return res.status(404).json({
                message: "Banner tidak ditemukan"
            });
        }

        // Simpan path gambar untuk dihapus
        const imagePath = banner.gambar;

        await banner.destroy();

        // Hapus file gambar
        try {
            const fullPath = path.join(process.cwd(), imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (error) {
            console.error('Error deleting image file:', error);
        }

        res.json({
            message: "Banner berhasil dihapus"
        });
    } catch (error) {
        console.error('Error in deleteBanner:', error);
        res.status(500).json({
            message: error.message,
            error: "Gagal menghapus banner"
        });
    }
};
