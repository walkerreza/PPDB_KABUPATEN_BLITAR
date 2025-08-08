import SessionUser from "../models/session_user.model.js";
import User from "../models/user.model.js";
import { Op } from "sequelize";
import moment from 'moment-timezone';

/**
 * Mendapatkan IP address dari request
 * @param {Object} req - Request object dari Express
 * @returns {string} IP address dalam format IPv4
 */
const getClientIp = (req) => {
    // Cek X-Forwarded-For header (jika menggunakan proxy/load balancer)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // Ambil IP address pertama jika ada multiple IP
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[0];
    }

    // Cek IP dari berbagai properti request
    const ip = req.ip || 
              req.connection.remoteAddress || 
              req.socket.remoteAddress || 
              req.connection.socket.remoteAddress;

    // Jika IPv6 localhost, ubah ke IPv4 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }

    // Jika IPv6, ambil bagian IPv4-nya
    if (ip.includes('::ffff:')) {
        return ip.split('::ffff:')[1];
    }

    return ip;
};

/**
 * Format tanggal ke format yang diinginkan dengan timezone Asia/Jakarta
 * @param {Date} date - Tanggal yang akan diformat
 * @returns {string} Tanggal yang sudah diformat
 */
const formatDate = (date) => {
    return moment(date).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Membuat session baru untuk user
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const createSession = async (req, res) => {
    try {
        const { id_user } = req.body;

        // Dapatkan informasi browser dan sistem operasi
        const userAgent = req.headers['user-agent'];
        
        // Dapatkan IP address yang sudah diformat
        const ip = getClientIp(req);

        // Set waktu expired (24 jam dari sekarang)
        const session_expired = moment().tz('Asia/Jakarta').add(24, 'hours').toDate();

        // Buat session baru
        const session = await SessionUser.create({
            id_user,
            session_expired,
            ip_address: ip,
            user_agent: userAgent
        });

        res.status(201).json({
            message: "Session berhasil dibuat",
            data: {
                ...session.toJSON(),
                session_expired: formatDate(session.session_expired)
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Gagal membuat session",
            error: error.message
        });
    }
};

/**
 * Mendapatkan semua session
 */
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await SessionUser.findAll({
            include: [{
                model: User,
                attributes: ['username', 'fullname']
            }]
        });

        // Format tanggal untuk setiap session
        const formattedSessions = sessions.map(session => ({
            ...session.toJSON(),
            session_expired: formatDate(session.session_expired)
        }));

        res.json({
            message: "Berhasil mendapatkan semua session",
            data: formattedSessions
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mendapatkan session",
            error: error.message
        });
    }
};

/**
 * Mendapatkan session berdasarkan user ID
 */
export const getSessionsByUser = async (req, res) => {
    try {
        const { id_user } = req.params;
        const sessions = await SessionUser.findAll({
            where: { id_user },
            include: [{
                model: User,
                attributes: ['username', 'fullname']
            }]
        });

        // Format tanggal untuk setiap session
        const formattedSessions = sessions.map(session => ({
            ...session.toJSON(),
            session_expired: formatDate(session.session_expired)
        }));

        res.json({
            message: "Berhasil mendapatkan session user",
            data: formattedSessions
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mendapatkan session user",
            error: error.message
        });
    }
};

/**
 * Mendapatkan session aktif berdasarkan user ID
 */
export const getActiveSessionsByUser = async (req, res) => {
    try {
        const { id_user } = req.params;
        const now = new Date();
        
        const sessions = await SessionUser.findAll({
            where: {
                id_user,
                session_expired: {
                    [Op.gt]: now
                }
            },
            include: [{
                model: User,
                attributes: ['username', 'fullname']
            }]
        });

        // Format tanggal untuk setiap session
        const formattedSessions = sessions.map(session => ({
            ...session.toJSON(),
            session_expired: formatDate(session.session_expired)
        }));

        res.json({
            message: "Berhasil mendapatkan session aktif user",
            data: formattedSessions
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal mendapatkan session aktif user",
            error: error.message
        });
    }
};

/**
 * Membersihkan session yang sudah expired
 */
export const cleanupExpiredSessions = async (req, res) => {
    try {
        const now = new Date();
        const result = await SessionUser.destroy({
            where: {
                session_expired: {
                    [Op.lt]: now
                }
            }
        });

        res.json({
            message: "Berhasil membersihkan session expired",
            data: {
                deleted_count: result
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal membersihkan session expired",
            error: error.message
        });
    }
};

export const deleteSessionById = async (req, res) => {
    try {
        const sessionId = req.params.id_session_user;

        // Cek apakah session dengan ID tersebut ada
        const session = await SessionUser.findByPk(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session tidak ditemukan"
            });
        }

        // Hapus session
        await session.destroy();

        res.status(200).json({
            success: true,
            message: "Session berhasil dihapus"
        });
    } catch (error) {
        console.error('Error saat menghapus session:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menghapus session",
            error: error.message
        });
    }
};
/**
 * Menghapus semua session berdasarkan user ID
 */
export const deleteSessionsByUserId = async (req, res) => {
    try {
        const { id_user } = req.params;

        // Hapus semua session untuk user tersebut
        await SessionUser.destroy({
            where: {
                id_user
            }
        });

        res.json({
            success: true,
            message: "Semua session user berhasil dihapus"
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus session user",
            error: error.message
        });
    }
};