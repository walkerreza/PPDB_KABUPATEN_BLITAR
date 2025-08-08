import KabupatenKota from "../models/kabupaten_kota.model.js";
import Provinsi from "../models/provinsi.model.js";
import { Op, Sequelize } from "sequelize";

// Mengambil semua data kabupaten/kota
export const getAllKabupatenKota = async (req, res) => {
    try {
        const kabupatenKota = await KabupatenKota.findAll({
            include: [{
                model: Provinsi,
                attributes: ['id_provinsi', 'nama_provinsi']
            }],
            order: [['nama_kabupaten_kota', 'ASC']] // Mengurutkan berdasarkan nama
        });
        res.json(kabupatenKota);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kabupaten/kota",
            error: error.message 
        });
    }
};

// Mengambil data kabupaten/kota berdasarkan ID
export const getKabupatenKotaById = async (req, res) => {
    try {
        const kabupatenKota = await KabupatenKota.findByPk(req.params.id, {
            include: [{
                model: Provinsi,
                attributes: ['id_provinsi', 'nama_provinsi']
            }]
        });
        
        if (!kabupatenKota) {
            return res.status(404).json({ message: "Kabupaten/Kota tidak ditemukan" });
        }
        
        res.json(kabupatenKota);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kabupaten/kota",
            error: error.message 
        });
    }
};

// Mencari kabupaten/kota berdasarkan nama
export const getKabupatenKotaByNama = async (req, res) => {
    try {
        const { nama } = req.body;
        
        if (!nama) {
            return res.status(400).json({ 
                message: "Nama kabupaten/kota harus diisi"
            });
        }

        // Konversi input ke huruf kecil
        const namaLower = nama.toLowerCase();

        const kabupatenKota = await KabupatenKota.findAll({
            where: Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('nama_kabupaten_kota')),
                { [Op.like]: `%${namaLower}%` }
            ),
            include: [{
                model: Provinsi,
                attributes: ['id_provinsi', 'nama_provinsi']
            }],
            order: [['nama_kabupaten_kota', 'ASC']]
        });

        if (kabupatenKota.length === 0) {
            return res.status(404).json({ 
                message: "Kabupaten/Kota tidak ditemukan"
            });
        }

        res.json(kabupatenKota);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mencari kabupaten/kota",
            error: error.message 
        });
    }
};
// Mengambil data kabupaten/kota berdasarkan ID provinsi
export const getKabupatenKotaByProvinsi = async (req, res) => {
    try {
        // Validasi parameter id provinsi
        const idProvinsi = req.params.provinsiId;
        if (!idProvinsi) {
            return res.status(400).json({ 
                message: "ID Provinsi tidak boleh kosong" 
            });
        }

        console.log('Mencari kabupaten/kota untuk provinsi ID:', idProvinsi);

        const kabupatenKota = await KabupatenKota.findAll({
            where: {
                id_provinsi: idProvinsi
            },
            include: [{
                model: Provinsi,
                attributes: ['id_provinsi', 'nama_provinsi']
            }],
            order: [['nama_kabupaten_kota', 'ASC']] // Mengurutkan berdasarkan nama
        });

        console.log(`Ditemukan ${kabupatenKota.length} kabupaten/kota`);

        if (kabupatenKota.length === 0) {
            return res.status(404).json({ 
                message: "Tidak ada kabupaten/kota yang ditemukan untuk provinsi ini" 
            });
        }

        res.json(kabupatenKota);
    } catch (error) {
        console.error('Error saat mengambil data kabupaten/kota:', error);
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data kabupaten/kota",
            error: error.message 
        });
    }
};