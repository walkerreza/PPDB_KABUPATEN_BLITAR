import Kecamatan from "../models/kecamatan.model.js";
import KabupatenKota from "../models/kabupaten_kota.model.js";
import { Op, Sequelize } from "sequelize";

// Mengambil semua data kecamatan
export const getAllKecamatan = async (req, res) => {
    try {
        const kecamatan = await Kecamatan.findAll({
            include: [{
                model: KabupatenKota,
                attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
            }],
            order: [['nama_kecamatan', 'ASC']]
        });
        res.json(kecamatan);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kecamatan",
            error: error.message 
        });
    }
};

// Mengambil data kecamatan berdasarkan ID
export const getKecamatanById = async (req, res) => {
    try {
        const kecamatan = await Kecamatan.findByPk(req.params.id, {
            include: [{
                model: KabupatenKota,
                attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
            }]
        });
        
        if (!kecamatan) {
            return res.status(404).json({ message: "Kecamatan tidak ditemukan" });
        }
        
        res.json(kecamatan);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kecamatan",
            error: error.message 
        });
    }
};

// Mencari kecamatan berdasarkan nama
export const getKecamatanByNama = async (req, res) => {
    try {
        const { nama } = req.body;
        
        if (!nama) {
            return res.status(400).json({ 
                message: "Nama kecamatan harus diisi"
            });
        }

        // Konversi input ke huruf kecil
        const namaLower = nama.toLowerCase();

        const kecamatan = await Kecamatan.findAll({
            where: Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('nama_kecamatan')),
                { [Op.like]: `%${namaLower}%` }
            ),
            include: [{
                model: KabupatenKota,
                attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
            }],
            order: [['nama_kecamatan', 'ASC']]
        });

        if (kecamatan.length === 0) {
            return res.status(404).json({ 
                message: "Kecamatan tidak ditemukan"
            });
        }

        res.json(kecamatan);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mencari kecamatan",
            error: error.message 
        });
    }
};
// Mengambil data kecamatan berdasarkan ID kabupaten/kota
export const getKecamatanByKabupatenKota = async (req, res) => {
    try {
        // Validasi parameter id kabupaten/kota
        const idKabupatenKota = req.params.kabupatenKotaId;
        if (!idKabupatenKota) {
            return res.status(400).json({ 
                message: "ID Kabupaten/Kota tidak boleh kosong" 
            });
        }

        console.log('Mencari kecamatan untuk Kabupaten/Kota ID:', idKabupatenKota);

        const kecamatan = await Kecamatan.findAll({
            where: {
                id_kabupaten_kota: idKabupatenKota
            },
            include: [{
                model: KabupatenKota,
                attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
            }],
            order: [['nama_kecamatan', 'ASC']] // Mengurutkan berdasarkan nama
        });

        console.log(`Ditemukan ${kecamatan.length} kecamatan`);

        if (kecamatan.length === 0) {
            return res.status(404).json({ 
                message: "Tidak ada kecamatan yang ditemukan untuk kabupaten/kota ini" 
            });
        }

        res.json(kecamatan);
    } catch (error) {
        console.error('Error saat mengambil data kecamatan:', error);
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kecamatan",
            error: error.message 
        });
    }
};
