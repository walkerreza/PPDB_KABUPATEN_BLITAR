import DataPenduduk from "../models/data_penduduk.model.js";
import { Op } from "sequelize";

// Mendapatkan semua data penduduk
export const getAllDataPenduduk = async (req, res) => {
    try {
        const response = await DataPenduduk.findAll({
            order: [['id_data_penduduk', 'DESC']]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Mendapatkan data penduduk berdasarkan ID
export const getDataPendudukById = async (req, res) => {
    try {
        const response = await DataPenduduk.findOne({
            where: {
                id_data_penduduk: req.params.id
            }
        });
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(404).json({ message: "Data tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Mencari data penduduk berdasarkan NIK
export const getDataPendudukByNik = async (req, res) => {
    const { nik } = req.params;
    try {
        const response = await DataPenduduk.findOne({
            where: {
                nik: nik
            }
        });
        
        if (response) {
            // Jika data ditemukan, kirim data lengkap
            res.status(200).json({
                status: "success",
                message: "Data ditemukan",
                data: response
            });
        } else {
            // Jika data tidak ditemukan
            res.status(404).json({
                status: "error",
                message: "Data dengan NIK tersebut tidak ditemukan",
                data: null
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            data: null
        });
    }
}

// Mencari data penduduk berdasarkan NIK atau NISN
export const searchDataPenduduk = async (req, res) => {
    const { query } = req.query;
    try {
        const response = await DataPenduduk.findAll({
            where: {
                [Op.or]: [
                    { nik: query },
                    { nisn: query }
                ]
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Validasi NISN
const validateNISN = async (nisn, excludeId = null) => {
    const whereClause = {
        nisn: nisn
    };
    
    // Jika ada ID yang dikecualikan (untuk update)
    if (excludeId) {
        whereClause.id_data_penduduk = {
            [Op.ne]: excludeId
        };
    }
    
    const existing = await DataPenduduk.findOne({
        where: whereClause
    });
    
    return !existing; // return true jika NISN belum ada
}

// Membuat data penduduk baru
export const createDataPenduduk = async (req, res) => {
    try {
        // Validasi NISN
        const nisnValid = await validateNISN(req.body.nisn);
        if (!nisnValid) {
            return res.status(400).json({
                status: "error",
                message: "NISN sudah terdaftar dalam database"
            });
        }

        const response = await DataPenduduk.create(req.body);
        res.status(201).json({
            status: "success",
            message: "Data Penduduk berhasil ditambahkan",
            data: response
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

// Mengupdate data penduduk
export const updateDataPenduduk = async (req, res) => {
    const id = req.params.id;
    try {
        // Cek apakah data ada
        const existingData = await DataPenduduk.findByPk(id);
        if (!existingData) {
            return res.status(404).json({
                status: "error",
                message: "Data tidak ditemukan"
            });
        }

        // Jika NISN diubah, validasi NISN baru
        if (req.body.nisn && req.body.nisn !== existingData.nisn) {
            const nisnValid = await validateNISN(req.body.nisn, id);
            if (!nisnValid) {
                return res.status(400).json({
                    status: "error",
                    message: "NISN sudah terdaftar dalam database"
                });
            }
        }

        // Update data
        const response = await DataPenduduk.update(req.body, {
            where: {
                id_data_penduduk: id
            }
        });

        res.status(200).json({
            status: "success",
            message: "Data Penduduk berhasil diperbarui"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}

// Menghapus data penduduk
export const deleteDataPenduduk = async (req, res) => {
    try {
        const response = await DataPenduduk.destroy({
            where: {
                id_data_penduduk: req.params.id
            }
        });
        if (response > 0) {
            res.status(200).json({
                status: "success",
                message: "Data Penduduk berhasil dihapus"
            });
        } else {
            res.status(404).json({
                status: "error",
                message: "Data tidak ditemukan"
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
}
