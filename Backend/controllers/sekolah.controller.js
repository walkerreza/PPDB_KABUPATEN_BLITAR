// Import model yang diperlukan
import Sekolah from "../models/sekolah.model.js";
import TipeSekolah from "../models/tipe_sekolah.model.js";
import Provinsi from "../models/provinsi.model.js";
import KabupatenKota from "../models/kabupaten_kota.model.js";
import Kecamatan from "../models/kecamatan.model.js";
import Kelurahan from "../models/kelurahan.model.js";
import { Op } from "sequelize";
import { Sequelize } from "sequelize";

// Mendapatkan semua data sekolah
export const getAllSekolah = async (req, res) => {
    try {
        const sekolah = await Sekolah.findAll({
            attributes: [
                'id_sekolah',
                'id_tipe_sekolah',
                'npsn',
                'nama',
                'address',
                'phone',
                'email',
                'latitude',
                'longitude',
                'zonasi',
                'prestasi',
                'pindahan',
                'afirmasi',
                'reguler'
            ],
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama'],
                    required: true
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ],
            order: [['nama', 'ASC']]
        });

        const transformedData = sekolah.map(item => ({
            id_sekolah: item.id_sekolah,
            id_tipe_sekolah: item.id_tipe_sekolah,
            npsn: item.npsn,
            nama: item.nama,
            address: item.address,
            phone: item.phone,
            email: item.email,
            latitude: item.latitude,
            longitude: item.longitude,
            zonasi: item.zonasi,
            prestasi: item.prestasi,
            pindahan: item.pindahan,
            afirmasi: item.afirmasi,
            reguler: item.reguler,
            tipe_sekolah: {
                id_tipe_sekolah: item.tipe_sekolah?.id_tipe_sekolah,
                nama: item.tipe_sekolah?.nama,
                slug: item.tipe_sekolah?.slug
            }
        }));

        res.json({
            message: "Data sekolah berhasil diambil",
            data: transformedData
        });
    } catch (error) {
        console.error('Error in getAllSekolah:', error);
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data sekolah",
            error: error.message 
        });
    }
};

// Mendapatkan data sekolah berdasarkan ID
export const getSekolahById = async (req, res) => {
    try {
        const sekolah = await Sekolah.findOne({
            where: {
                id_sekolah: req.params.id
            },
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ]
        });
        
        if (!sekolah) {
            return res.status(404).json({ 
                status: false,
                message: "Sekolah tidak ditemukan" 
            });
        }
        
        res.json({
            status: true,
            message: "Data sekolah berhasil diambil",
            data: sekolah
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data sekolah",
            error: error.message 
        });
    }
};

// Membuat data sekolah baru
export const createSekolah = async (req, res) => {
    try {
        // Cek apakah NPSN sudah ada
        const existingSekolah = await Sekolah.findOne({
            where: {
                npsn: req.body.npsn
            }
        });

        if (existingSekolah) {
            return res.status(400).json({
                message: "NPSN sudah terdaftar",
                error: "Sekolah dengan NPSN tersebut sudah ada dalam database"
            });
        }

        const sekolah = await Sekolah.create(req.body);
        
        // Ambil data lengkap sekolah setelah create
        const sekolahWithRelations = await Sekolah.findOne({
            where: { id_sekolah: sekolah.id_sekolah },
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ]
        });
        
        res.status(201).json({
            message: "Data sekolah berhasil ditambahkan",
            data: sekolahWithRelations
        });
    } catch (error) {
        res.status(400).json({ 
            message: "Gagal menambahkan data sekolah",
            error: error.message 
        });
    }
};

// Mengupdate data sekolah
export const updateSekolah = async (req, res) => {
    try {
        const updated = await Sekolah.update(req.body, {
            where: {
                id_sekolah: req.params.id
            }
        });

        if (updated[0] === 0) {
            return res.status(404).json({ message: "Sekolah tidak ditemukan" });
        }

        // Ambil data yang sudah diupdate
        const updatedSekolah = await Sekolah.findOne({
            where: { id_sekolah: req.params.id },
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ]
        });

        res.json({
            message: "Data sekolah berhasil diperbarui",
            data: updatedSekolah
        });
    } catch (error) {
        res.status(400).json({ 
            message: "Gagal memperbarui data sekolah",
            error: error.message 
        });
    }
};

// Menghapus data sekolah
export const deleteSekolah = async (req, res) => {
    try {
        const deleted = await Sekolah.destroy({
            where: {
                id_sekolah: req.params.id
            }
        });

        if (!deleted) {
            return res.status(404).json({ message: "Sekolah tidak ditemukan" });
        }

        res.json({
            message: "Data sekolah berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Gagal menghapus data sekolah",
            error: error.message 
        });
    }
};

// Mencari sekolah berdasarkan nama
export const searchSekolah = async (req, res) => {
    const { nama } = req.query;
    try {
        const sekolah = await Sekolah.findAll({
            where: {
                nama: {
                    [Op.like]: `%${nama}%`
                }
            },
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ],
            order: [['id_sekolah', 'ASC']]
        });
        res.json(sekolah);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mencari sekolah",
            error: error.message 
        });
    }
};

// Mendapatkan sekolah berdasarkan tipe
// Mendapatkan sekolah berdasarkan tipe
export const getSekolahByTipe = async (req, res) => {
    try {
        console.log('Mencari sekolah dengan tipe ID:', req.params.tipeId);
        
        const tipeSekolah = await TipeSekolah.findByPk(req.params.tipeId);
        if (!tipeSekolah) {
            console.log('Tipe sekolah tidak ditemukan');
            return res.status(404).json({
                message: "Tipe sekolah tidak ditemukan"
            });
        }
        console.log('Tipe sekolah ditemukan:', tipeSekolah.toJSON());

        const sekolah = await Sekolah.findAll({
            where: {
                id_tipe_sekolah: req.params.tipeId
            },
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ],
            order: [['nama', 'ASC']]
        });

        console.log('Jumlah sekolah ditemukan:', sekolah.length);
        
        if (sekolah.length === 0) {
            console.log('Tidak ada sekolah untuk tipe ini');
            return res.status(404).json({
                message: "Tidak ada sekolah untuk tipe ini"
            });
        }

        res.json(sekolah);
    } catch (error) {
        console.error('Error di getSekolahByTipe:', error);
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data sekolah",
            error: error.message 
        });
    }
};

// Mendapatkan sekolah berdasarkan wilayah (Provinsi/Kota/Kecamatan/Kelurahan)
export const getSekolahByWilayah = async (req, res) => {
    const { provinsiId, kotaId, kecamatanId, kelurahanId } = req.query;
    
    try {
        const whereClause = {};
        
        if (provinsiId) whereClause.id_provinsi = provinsiId;
        if (kotaId) whereClause.id_kabupaten_kota = kotaId;
        if (kecamatanId) whereClause.id_kecamatan = kecamatanId;
        if (kelurahanId) whereClause.id_kelurahan = kelurahanId;
        
        const sekolah = await Sekolah.findAll({
            where: whereClause,
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                },
                {
                    model: Provinsi,
                    attributes: ['id_provinsi', 'nama_provinsi']
                },
                {
                    model: KabupatenKota,
                    attributes: ['id_kabupaten_kota', 'nama_kabupaten_kota']
                },
                {
                    model: Kecamatan,
                    attributes: ['id_kecamatan', 'nama_kecamatan']
                },
                {
                    model: Kelurahan,
                    attributes: ['id_kelurahan', 'nama_kelurahan']
                }
            ],
            order: [['id_sekolah', 'ASC']]
        });
        
        res.json(sekolah);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data sekolah",
            error: error.message 
        });
    }
};

// Update pagu sekolah
export const updatePaguSekolah = async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!Array.isArray(data)) {
            return res.status(400).json({ 
                message: "Data harus berupa array",
                error: "Invalid data format" 
            });
        }

        const updatePromises = data.map(async (item) => {
            const { id_sekolah, zonasi, afirmasi, prestasi, pindahan, reguler } = item;
            
            try {
                const updated = await Sekolah.update(
                    { zonasi, afirmasi, prestasi, pindahan, reguler },
                    { where: { id_sekolah } }
                );
                
                if (updated[0] === 0) {
                    return { 
                        success: false, 
                        id_sekolah,
                        message: "Sekolah tidak ditemukan" 
                    };
                }
                
                return { 
                    success: true, 
                    id_sekolah 
                };
            } catch (error) {
                return { 
                    success: false, 
                    id_sekolah,
                    message: error.message 
                };
            }
        });

        const results = await Promise.all(updatePromises);
        const failedUpdates = results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
            return res.status(400).json({
                message: "Beberapa update gagal dilakukan",
                failedUpdates
            });
        }

        // Ambil data terbaru setelah update
        const updatedSchools = await Sekolah.findAll({
            where: {
                id_sekolah: {
                    [Op.in]: data.map(item => item.id_sekolah)
                }
            },
            attributes: ['id_sekolah', 'nama', 'zonasi', 'afirmasi', 'prestasi', 'pindahan', 'reguler']
        });

        res.json({
            message: "Pagu sekolah berhasil diperbarui",
            data: updatedSchools
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat memperbarui pagu sekolah",
            error: error.message 
        });
    }
};

// Get total sekolah dan total per tipe sekolah
export const getTotalSekolah = async (req, res) => {
    try {
        // Definisi kategori sekolah sesuai dengan Pagu.jsx
        const schoolCategories = {
            TK: { label: 'TK', ids: [112] },
            RA: { label: 'RA', ids: [122] },
            SD: { label: 'SD', ids: [211, 212] },
            MI: { label: 'MI', ids: [221, 222] },
            SLTP: { label: 'SLTP', ids: [311, 312] },
            MTS: { label: 'MTS', ids: [321, 322] }
        };
        
        // Hitung total seluruh sekolah
        const totalSekolah = await Sekolah.count();
        
        // Hitung total per kategori sekolah
        const totals = await Promise.all(
            Object.entries(schoolCategories).map(async ([key, category]) => {
                const total = await Sekolah.count({
                    where: {
                        id_tipe_sekolah: {
                            [Op.in]: category.ids
                        }
                    }
                });
                console.log(`Total untuk ${category.label}:`, total); // Debug log
                return {
                    label: category.label.trim(),
                    value: total.toString()
                };
            })
        );

        const formattedResponse = {
            total: totalSekolah,
            perTipe: totals
        };

        console.log('Response data:', formattedResponse); // Debug log

        res.status(200).json({
            status: true,
            message: "Data total sekolah berhasil didapatkan",
            data: formattedResponse
        });

    } catch (error) {
        console.error('Error in getTotalSekolah:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// Mendapatkan sekolah berdasarkan jenjang (TK/SD/SMP)
export const getSekolahByJenjang = async (req, res) => {
    try {
        const { jenjang } = req.params;
        
        // Mapping jenjang ke id_tipe_sekolah
        let tipeSekolahIds = [];
        switch(jenjang.toLowerCase()) {
            case 'tk':
                tipeSekolahIds = [112, 122]; // TK dan RA
                break;
            case 'sd':
                tipeSekolahIds = [211, 212, 221, 222]; // SDN, SDS, MIN, MIS
                break;
            case 'smp':
                tipeSekolahIds = [311, 312, 321, 322]; // SMPN, SMPS, MTSN, MTSS
                break;
            default:
                return res.status(400).json({
                    status: false,
                    message: "Jenjang tidak valid. Gunakan: tk, sd, atau smp"
                });
        }

        const sekolah = await Sekolah.findAll({
            where: {
                id_tipe_sekolah: {
                    [Op.in]: tipeSekolahIds
                }
            },
            attributes: [
                'id_sekolah',
                'npsn',
                'nama',
                'address',
                'id_tipe_sekolah'
            ],
            include: [
                {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah', 'slug', 'nama']
                }
            ],
            order: [['nama', 'ASC']]
        });

        if (sekolah.length === 0) {
            return res.status(404).json({
                status: false,
                message: `Tidak ada sekolah ditemukan untuk jenjang ${jenjang.toUpperCase()}`
            });
        }

        res.json({
            status: true,
            message: `Data sekolah jenjang ${jenjang.toUpperCase()} berhasil diambil`,
            data: sekolah
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Terjadi kesalahan saat mengambil data sekolah",
            error: error.message
        });
    }
};