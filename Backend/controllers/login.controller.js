import User from '../models/user.model.js';
import SessionUser from '../models/session_user.model.js';
import Sekolah from '../models/sekolah.model.js'; // tambahkan import model Sekolah
import JenisKelamin from '../models/jenis_kelamin.model.js'; // tambahkan import model JenisKelamin
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/VerifyToken.js';
import moment from 'moment-timezone';
import { Op } from 'sequelize';
import TipeSekolah from '../models/tipe_sekolah.model.js';

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
 * Controller untuk login user
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validasi input
        if (!username || !password) {
            return res.status(400).json({
                message: "Username dan password harus diisi"
            });
        }

        // Cari user berdasarkan username
        const user = await User.findOne({
            where: { username },
            include: [
                {
                    model: Sekolah,
                    include: [
                        {
                            model: TipeSekolah,                            
                        }
                    ]                    
                },
                {
                    model: JenisKelamin,                    
                }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Verifikasi password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                id_user: user.id_user,
                username: user.username,
                id_grup_user: user.id_grup_user
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Format waktu expired token
        const tokenExpired = moment()
            .tz('Asia/Jakarta')
            .add(24, 'hours')
            .format('YYYY-MM-DD HH:mm:ss');

        // Dapatkan IP address yang sudah diformat
        const clientIp = getClientIp(req);

        // Buat session baru
        const session = await SessionUser.create({
            id_user: user.id_user,
            session_expired: moment().tz('Asia/Jakarta').add(24, 'hours').toDate(),
            ip_address: clientIp,
            user_agent: req.headers['user-agent'],
            token: token,
            expired: tokenExpired
        });

        // Kirim response
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                // Data utama user
                id_user: user.id_user,
                username: user.username,
                fullname: user.fullname,        
                phone: user.phone,
                address: user.address,
                photo: user.photo,
                email: user.email,
                status: user.status,
                
                // Data relasi
                id_jenis_kelamin: user.id_jenis_kelamin,
                jenis_kelamin: user.jenis_kelamin,
                id_grup_user: user.id_grup_user,
                id_sekolah: user.id_sekolah,
                sekolah: user.sekolah,

                // Data session
                token: token,
                token_expired: tokenExpired,
                session_id: session.id
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Gagal melakukan login",
            error: error.message
        });
    }
};

/**
 * Controller untuk logout user
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
export const logout = async (req, res) => {
    try {
        const id_user = req.user.id_user;

        // Update session expired untuk user ini
        await SessionUser.update({
            session_expired: new Date()
        }, {
            where: {
                id_user: id_user,
                session_expired: {
                    [Op.gt]: new Date() // session yang belum expired
                }
            }
        });

        res.json({
            message: "Logout berhasil"
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal melakukan logout",
            error: error.message
        });
    }
};
