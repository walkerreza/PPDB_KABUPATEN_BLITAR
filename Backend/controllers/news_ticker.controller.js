import NewsTicker from "../models/news_ticker.model.js";
import { Op } from "sequelize";
import Sequelize from 'sequelize';

/**
 * Controller untuk mengelola news ticker
 */

// Mendapatkan semua news ticker
export const getAllNews = async (req, res) => {
    try {
        const news = await NewsTicker.findAll({
            order: [['id_news_ticker', 'DESC']]
        });
        res.json(news);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data news ticker"
        });
    }
};

// Mendapatkan news ticker aktif
export const getActiveNews = async (req, res) => {
    try {
        const news = await NewsTicker.findAll({
            where: {
                status: 1
            },
            order: [['id_news_ticker', 'DESC']]
        });
        res.json(news);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data news ticker aktif"
        });
    }
};

// Mendapatkan news ticker berdasarkan ID
export const getNewsById = async (req, res) => {
    try {
        const news = await NewsTicker.findByPk(req.params.id);
        if (!news) {
            return res.status(404).json({
                message: "News ticker tidak ditemukan"
            });
        }
        res.json(news);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengambil data news ticker"
        });
    }
};

// Mencari news ticker berdasarkan judul atau deskripsi
export const searchNewsTicker = async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search) {
            return res.status(400).json({
                message: "Kata kunci pencarian harus diisi"
            });
        }

        const news = await NewsTicker.findAll({
            where: {
                [Op.or]: [
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.col('judul')),
                        'LIKE',
                        '%' + search.toLowerCase() + '%'
                    ),
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.col('deskripsi')),
                        'LIKE',
                        '%' + search.toLowerCase() + '%'
                    )
                ]
            },
            order: [['id_news_ticker', 'DESC']]
        });

        res.json(news);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal melakukan pencarian news ticker"
        });
    }
};

// Membuat news ticker baru
export const createNews = async (req, res) => {
    try {
        const { judul, deskripsi, status } = req.body;

        // Validasi input
        if (!judul || !deskripsi) {
            return res.status(400).json({
                message: "Judul dan deskripsi harus diisi"
            });
        }

        const news = await NewsTicker.create({
            judul,
            deskripsi,
            status: status === undefined ? 0 : Number(status) // default non-aktif (0)
        });

        res.status(201).json({
            message: "News ticker berhasil dibuat",
            data: news
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal membuat news ticker"
        });
    }
};

// Mengupdate news ticker
export const updateNews = async (req, res) => {
    try {
        const news = await NewsTicker.findByPk(req.params.id);
        if (!news) {
            return res.status(404).json({
                message: "News ticker tidak ditemukan"
            });
        }

        const { judul, deskripsi, status } = req.body;

        await news.update({
            judul: judul || news.judul,
            deskripsi: deskripsi || news.deskripsi,
            status: status !== undefined ? status : news.status
        });

        res.json({
            message: "News ticker berhasil diupdate",
            data: news
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal mengupdate news ticker"
        });
    }
};

// Menghapus news ticker
export const deleteNews = async (req, res) => {
    try {
        const news = await NewsTicker.findByPk(req.params.id);
        if (!news) {
            return res.status(404).json({
                message: "News ticker tidak ditemukan"
            });
        }

        await news.destroy();
        res.json({
            message: "News ticker berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            error: "Gagal menghapus news ticker"
        });
    }
};