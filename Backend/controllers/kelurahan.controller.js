import Kelurahan from "../models/kelurahan.model.js";
import Kecamatan from "../models/kecamatan.model.js";
import { Op, Sequelize } from "sequelize";

// Mengambil semua data kelurahan
export const getAllKelurahan = async (req, res) => {
    try {
        const kelurahan = await Kelurahan.findAll({
            include: [{
                model: Kecamatan,
                attributes: ['id_kecamatan', 'nama_kecamatan']
            }],
            order: [['nama_kelurahan', 'ASC']]
        });
        res.json(kelurahan);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kelurahan",
            error: error.message 
        });
    }
};

// Mengambil data kelurahan berdasarkan ID
export const getKelurahanById = async (req, res) => {
    try {
        const kelurahan = await Kelurahan.findByPk(req.params.id, {
            include: [{
                model: Kecamatan,
                attributes: ['id_kecamatan', 'nama_kecamatan']
            }]
        });
        
        if (!kelurahan) {
            return res.status(404).json({ message: "Kelurahan tidak ditemukan" });
        }
        
        res.json(kelurahan);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kelurahan",
            error: error.message 
        });
    }
};

// Mencari kelurahan berdasarkan nama
export const getKelurahanByNama = async (req, res) => {
    try {
        const { nama } = req.body;
        
        if (!nama) {
            return res.status(400).json({ 
                message: "Nama kelurahan harus diisi"
            });
        }

        // Konversi input ke huruf kecil
        const namaLower = nama.toLowerCase();

        const kelurahan = await Kelurahan.findAll({
            where: Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('nama_kelurahan')),
                { [Op.like]: `%${namaLower}%` }
            ),
            include: [{
                model: Kecamatan,
                attributes: ['id_kecamatan', 'nama_kecamatan']
            }],
            order: [['nama_kelurahan', 'ASC']]
        });

        if (kelurahan.length === 0) {
            return res.status(404).json({ 
                message: "Kelurahan tidak ditemukan"
            });
        }

        res.json(kelurahan);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mencari kelurahan",
            error: error.message 
        });
    }
};
// Mengambil data kelurahan berdasarkan ID kecamatan
export const getKelurahanByKecamatan = async (req, res) => {
    try {
        // Validasi parameter id kecamatan
        const idKecamatan = req.params.kecamatanId;
        if (!idKecamatan) {
            return res.status(400).json({ 
                message: "ID Kecamatan tidak boleh kosong" 
            });
        }

        console.log('Mencari kelurahan untuk Kecamatan ID:', idKecamatan);

        const kelurahan = await Kelurahan.findAll({
            where: {
                id_kecamatan: idKecamatan
            },
            include: [{
                model: Kecamatan,
                attributes: ['id_kecamatan', 'nama_kecamatan']
            }],
            order: [['nama_kelurahan', 'ASC']] // Mengurutkan berdasarkan nama
        });

        console.log(`Ditemukan ${kelurahan.length} kelurahan`);

        if (kelurahan.length === 0) {
            return res.status(404).json({ 
                message: "Tidak ada kelurahan yang ditemukan untuk kecamatan ini" 
            });
        }

        res.json(kelurahan);
    } catch (error) {
        console.error('Error saat mengambil data kelurahan:', error);
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kelurahan",
            error: error.message 
        });
    }
};
