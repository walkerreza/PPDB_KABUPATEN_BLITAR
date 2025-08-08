import JadwalPendaftaran from "../models/jadwal_pendaftaran.model.js";
import moment from 'moment-timezone';
import { Op } from 'sequelize';

/**
 * Controller untuk mengelola jadwal pendaftaran
 */

// Set timezone untuk Jakarta
moment.tz.setDefault('Asia/Jakarta');

// Fungsi untuk format tanggal
const formatDate = (date) => {
    if (!date) return null;
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Format response jadwal
const formatJadwalResponse = (jadwal) => {
    if (Array.isArray(jadwal)) {
        return jadwal.map(item => ({
            id_jadwal_pendaftaran: item.id_jadwal_pendaftaran,
            tanggal_mulai: moment(item.tanggal_mulai).format('YYYY-MM-DD HH:mm:ss'),
            tanggal_selesai: moment(item.tanggal_selesai).format('YYYY-MM-DD HH:mm:ss'),
            event: item.event,
            status: Number(item.status),
            is_public: Number(item.is_public)
        }));
    }
    return {
        id_jadwal_pendaftaran: jadwal.id_jadwal_pendaftaran,
        tanggal_mulai: moment(jadwal.tanggal_mulai).format('YYYY-MM-DD HH:mm:ss'),
        tanggal_selesai: moment(jadwal.tanggal_selesai).format('YYYY-MM-DD HH:mm:ss'),
        event: jadwal.event,
        status: Number(jadwal.status),
        is_public: Number(jadwal.is_public)
    };
};

// Mendapatkan semua jadwal pendaftaran
export const getAllJadwal = async (req, res) => {
    try {
        const jadwal = await JadwalPendaftaran.findAll({
            order: [
                ['tanggal_mulai', 'ASC'] // Urutkan berdasarkan tanggal mulai
            ],
            raw: true // Ambil data mentah
        });

        // Format response
        const formattedJadwal = formatJadwalResponse(jadwal);

        res.json({
            status: 'success',
            message: "Berhasil mendapatkan data jadwal pendaftaran",
            data: formattedJadwal
        });
    } catch (error) {
        console.error('Error getting jadwal:', error);
        res.status(500).json({
            status: 'error',
            message: "Gagal mendapatkan data jadwal pendaftaran",
            error: error.message
        });
    }
};

// Mendapatkan jadwal pendaftaran berdasarkan ID
export const getJadwalById = async (req, res) => {
    try {
        const jadwal = await JadwalPendaftaran.findByPk(req.params.id);
        
        if (!jadwal) {
            return res.status(404).json({
                status: 'error',
                message: "Jadwal pendaftaran tidak ditemukan"
            });
        }
        
        res.json({
            status: 'success',
            data: formatJadwalResponse(jadwal)
        });
    } catch (error) {
        console.error('Error getting jadwal:', error);
        res.status(500).json({
            status: 'error',
            message: "Gagal mengambil data jadwal pendaftaran",
            error: error.message
        });
    }
};

// Membuat jadwal pendaftaran baru
export const createJadwal = async (req, res) => {
    try {
        const { tanggal_mulai, tanggal_selesai, event, status } = req.body;

        // Validasi input
        if (!tanggal_mulai || !tanggal_selesai || !event) {
            return res.status(400).json({
                status: 'error',
                message: "Semua field harus diisi"
            });
        }

        // Validasi format tanggal
        if (!moment(tanggal_mulai, moment.ISO_8601, true).isValid() || 
            !moment(tanggal_selesai, moment.ISO_8601, true).isValid()) {
            return res.status(400).json({
                status: 'error',
                message: "Format tanggal tidak valid"
            });
        }

        // Validasi tanggal mulai harus sebelum tanggal selesai
        if (moment(tanggal_mulai).isAfter(tanggal_selesai)) {
            return res.status(400).json({
                status: 'error',
                message: "Tanggal mulai harus sebelum tanggal selesai"
            });
        }

        // Validasi panjang event
        if (event.trim().length < 3) {
            return res.status(400).json({
                status: 'error',
                message: "Nama event minimal 3 karakter"
            });
        }

        const jadwal = await JadwalPendaftaran.create({
            tanggal_mulai,
            tanggal_selesai,
            event,
            status: req.body.status === '1' || req.body.status === 1 ? 1 : 0
        });

        res.status(201).json({
            status: 'success',
            message: "Jadwal pendaftaran berhasil dibuat",
            data: formatJadwalResponse(jadwal)
        });
    } catch (error) {
        console.error('Error creating jadwal:', error);
        res.status(500).json({
            status: 'error',
            message: "Gagal membuat jadwal pendaftaran",
            error: error.message
        });
    }
};

// Mengupdate jadwal pendaftaran
export const updateJadwal = async (req, res) => {
    try {
        const { tanggal_mulai, tanggal_selesai, event, status } = req.body;
        const { id } = req.params;

        // Validasi input
        if (!tanggal_mulai || !tanggal_selesai || !event) {
            return res.status(400).json({
                status: 'error',
                message: "Semua field harus diisi"
            });
        }

        // Validasi format tanggal
        if (!moment(tanggal_mulai, moment.ISO_8601, true).isValid() || 
            !moment(tanggal_selesai, moment.ISO_8601, true).isValid()) {
            return res.status(400).json({
                status: 'error',
                message: "Format tanggal tidak valid"
            });
        }

        // Validasi tanggal mulai harus sebelum tanggal selesai
        if (moment(tanggal_mulai).isAfter(tanggal_selesai)) {
            return res.status(400).json({
                status: 'error',
                message: "Tanggal mulai harus sebelum tanggal selesai"
            });
        }

        // Validasi panjang event
        if (event.trim().length < 3) {
            return res.status(400).json({
                status: 'error',
                message: "Nama event minimal 3 karakter"
            });
        }

        const jadwal = await JadwalPendaftaran.findByPk(id);
        if (!jadwal) {
            return res.status(404).json({
                status: 'error',
                message: "Jadwal pendaftaran tidak ditemukan"
            });
        }

        await jadwal.update({
            tanggal_mulai,
            tanggal_selesai,
            event,
            status: req.body.status === '1' || req.body.status === 1 ? 1 : 0
        });

        res.json({
            status: 'success',
            message: "Jadwal pendaftaran berhasil diupdate",
            data: formatJadwalResponse(jadwal)
        });
    } catch (error) {
        console.error('Error updating jadwal:', error);
        res.status(500).json({
            status: 'error',
            message: "Gagal mengupdate jadwal pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mencari jadwal pendaftaran berdasarkan nama event
 * @param {Object} req - Request object yang berisi query parameters
 * @param {Object} res - Response object
 * @returns {Object} Response dengan hasil pencarian jadwal
 */
export const searchJadwal = async (req, res) => {
    try {
        const { search } = req.query;
        
        // Jika tidak ada parameter search, kembalikan semua data
        if (!search) {
            const allJadwal = await JadwalPendaftaran.findAll({
                order: [['tanggal_mulai', 'DESC']]
            });
            return res.json({
                status: 'success',
                data: formatJadwalResponse(allJadwal)
            });
        }

        // Mencari berdasarkan event
        const jadwal = await JadwalPendaftaran.findAll({
            where: {
                event: {
                    [Op.like]: `%${search}%`
                }
            },
            order: [['tanggal_mulai', 'DESC']]
        });

        // Jika tidak ada hasil
        if (jadwal.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: "Tidak ada jadwal yang ditemukan dengan nama event tersebut"
            });
        }

        res.json({
            status: 'success',
            data: formatJadwalResponse(jadwal)
        });
    } catch (error) {
        console.error('Error searching jadwal:', error);
        res.status(500).json({
            status: 'error',
            message: "Gagal melakukan pencarian jadwal pendaftaran",
            error: error.message
        });
    }
};

// Menghapus jadwal pendaftaran
export const deleteJadwal = async (req, res) => {
    try {
        const jadwal = await JadwalPendaftaran.findByPk(req.params.id);
        if (!jadwal) {
            return res.status(404).json({
                status: 'error',
                message: "Jadwal pendaftaran tidak ditemukan"
            });
        }

        await jadwal.destroy();
        res.json({
            status: 'success',
            message: "Jadwal pendaftaran berhasil dihapus"
        });
    } catch (error) {
        console.error('Error deleting jadwal:', error);
        res.status(500).json({
            status: 'error',
            message: "Gagal menghapus jadwal pendaftaran",
            error: error.message
        });
    }
};

// Fungsi untuk mendapatkan status jadwal sistem berdasarkan ID
export const getJadwalSistemById = async (req, res) => {
    try {
        const jadwal = await JadwalPendaftaran.findOne({
            where: {
                id_jadwal_pendaftaran: req.params.id,
                is_public: 1
            }
        });

        if (!jadwal) {
            return res.status(404).json({
                status: false,
                message: "Jadwal sistem tidak ditemukan"
            });
        }

        // Set timezone ke Asia/Jakarta
        moment.tz.setDefault('Asia/Jakarta');
        
        // Mendapatkan waktu sekarang dalam format Asia/Jakarta
        const currentTime = moment();
        
        // Konversi waktu jadwal ke moment dengan timezone Asia/Jakarta
        const startTime = moment(jadwal.tanggal_mulai);
        const endTime = moment(jadwal.tanggal_selesai);

        // Cek apakah waktu sekarang berada dalam rentang jadwal
        const isOpen = currentTime.isBetween(startTime, endTime, null, '[]') && jadwal.status === 1;

        return res.status(200).json({
            status: true,
            message: "Berhasil mendapatkan status jadwal sistem",
            data: {
                jadwal: {
                    id: jadwal.id_jadwal_pendaftaran,
                    event: jadwal.event,
                    tanggal_mulai: startTime.format('YYYY-MM-DD HH:mm:ss'),
                    tanggal_selesai: endTime.format('YYYY-MM-DD HH:mm:ss'),
                    is_public: jadwal.is_public,
                    status: jadwal.status
                },
                is_open: isOpen,
                current_time: currentTime.format('YYYY-MM-DD HH:mm:ss')
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};