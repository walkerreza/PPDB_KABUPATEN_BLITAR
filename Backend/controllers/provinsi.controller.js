import Provinsi from "../models/provinsi.model.js";
import { Op, Sequelize } from "sequelize";

// Mengambil semua data provinsi
export const getAllProvinsi = async (req, res) => {
    try {
        const provinsi = await Provinsi.findAll({
            order: [['nama_provinsi', 'ASC']] // Mengurutkan berdasarkan nama provinsi
        });
        res.json(provinsi);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data provinsi",
            error: error.message
        });
    }
};

// Mengambil data provinsi berdasarkan ID
export const getProvinsiById = async (req, res) => {
    try {
        const provinsi = await Provinsi.findByPk(req.params.id);
        if (!provinsi) {
            return res.status(404).json({ message: "Provinsi tidak ditemukan" });
        }
        res.json(provinsi);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data provinsi",
            error: error.message 
        });
    }
};

// Mencari provinsi berdasarkan nama
export const getProvinsiByNama = async (req, res) => {
    try {
        const { nama } = req.body;
        
        if (!nama) {
            return res.status(400).json({ 
                message: "Nama provinsi harus diisi"
            });
        }

        // Konversi input ke huruf kecil
        const namaLower = nama.toLowerCase();

        const provinsi = await Provinsi.findAll({
            where: Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('nama_provinsi')),
                { [Op.like]: `%${namaLower}%` }
            ),
            order: [['nama_provinsi', 'ASC']]
        });

        if (provinsi.length === 0) {
            return res.status(404).json({ 
                message: "Provinsi tidak ditemukan"
            });
        }

        res.json(provinsi);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mencari provinsi",
            error: error.message 
        });
    }
};
