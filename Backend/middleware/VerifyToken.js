import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Secret key untuk JWT
 * Sebaiknya simpan di environment variable
 */
export const JWT_SECRET = 'ppdb-secret-key-2025';

/**
 * Middleware untuk memverifikasi JWT token
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 * @param {Function} next - Next middleware function
 */
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            message: "Akses ditolak! Token tidak ditemukan"
        });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Cek apakah user masih ada di database
        const user = await User.findByPk(decoded.id_user, {
            attributes: ['id_user', 'username', 'fullname', 'id_grup_user']
        });

        if (!user) {
            return res.status(401).json({
                message: "User tidak ditemukan!"
            });
        }

        // Simpan data user di request object
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: "Token sudah expired! Silakan login kembali"
            });
        }
        
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message: "Token tidak valid!"
            });
        }

        return res.status(500).json({
            message: "Gagal memverifikasi token",
            error: error.message
        });
    }
};

/**
 * Middleware untuk memverifikasi role/grup user
 * @param {Array} allowedGroups - Array of allowed group IDs
 */
export const verifyGroups = (allowedGroups) => {
    return (req, res, next) => {
        // Pastikan middleware verifyToken sudah dijalankan
        if (!req.user) {
            return res.status(401).json({
                message: "Akses ditolak! Token tidak terverifikasi"
            });
        }

        // Cek apakah grup user diizinkan
        if (!allowedGroups.includes(req.user.id_grup_user)) {
            return res.status(403).json({
                message: "Akses ditolak! Anda tidak memiliki izin"
            });
        }

        next();
    };
};