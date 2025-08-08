// Import model yang diperlukan
import User from "../models/user.model.js";
import JenisKelamin from "../models/jenis_kelamin.model.js";
import GrupUser from "../models/grup_user.model.js";
import Sekolah from "../models/sekolah.model.js";
import TipeSekolah from "../models/tipe_sekolah.model.js"; // Import model TipeSekolah
import { Op, Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import { uploadUser } from "../config/multer.config.js";
import fs from "fs";
import db from '../config/db.config.js';

// Mengambil semua data user
export const getAllUser = async (req, res) => {
    try {
        // Ambil parameter include dan jenjang dari query
        const { include, jenjang } = req.query;
        
        // Siapkan opsi untuk query
        const options = {
            include: [],
            order: [['fullname', 'ASC']]
        };
        
        // Tambahkan include jika diperlukan
        if (include) {
            const includeOptions = include.split(',');
            
            // Include JenisKelamin
            options.include.push({
                model: JenisKelamin,
                attributes: ['id_jenis_kelamin', 'nama']
            });
            
            // Include GrupUser
            options.include.push({
                model: GrupUser,
                attributes: ['id_grup_user', 'nama']
            });
            
            // Include Sekolah jika diminta
            if (includeOptions.includes('sekolah')) {
                const sekolahInclude = {
                    model: Sekolah,
                    attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                    required: false
                };
                
                // Include TipeSekolah jika diminta
                if (includeOptions.includes('tipe_sekolah')) {
                    sekolahInclude.include = [{
                        model: TipeSekolah,
                        attributes: ['id_tipe_sekolah', 'nama']
                    }];
                }
                
                options.include.push(sekolahInclude);
            }
        } else {
            // Default include jika tidak ada parameter
            options.include = [
                {
                    model: JenisKelamin,
                    attributes: ['id_jenis_kelamin', 'nama']
                },
                {
                    model: GrupUser,
                    attributes: ['id_grup_user', 'nama']
                },
                {
                    model: Sekolah,
                    attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                    required: false,
                    include: [
                        {
                            model: TipeSekolah,
                            attributes: ['id_tipe_sekolah', 'nama']
                        }
                    ]
                }
            ];
        }
        
        // Filter berdasarkan jenjang jika parameter jenjang ada
        if (jenjang) {
            const jenjangArray = jenjang.split(',').map(j => parseInt(j.trim()));
            
            // Gunakan kondisi where yang sederhana untuk menghindari error SQL
            options.where = {
                [Op.or]: [
                    // User DINAS dan operator bidang selalu ditampilkan
                    { id_grup_user: { [Op.in]: [1, 4, 5, 6, 7] } },
                    
                    // Admin SEKOLAH (id_grup_user=2) yang sekolahnya sesuai jenjang
                    {
                        [Op.and]: [
                            { id_grup_user: 2 },
                            { 
                                '$sekolah.id_tipe_sekolah$': { 
                                    [Op.in]: jenjangArray 
                                }
                            }
                        ]
                    }
                ]
            };
            
            // Pendaftar (id_grup_user=3) ditangani dalam separate query
            if (jenjangArray && jenjangArray.length > 0) {
                // Mendapatkan daftar id_user pendaftar yang sesuai jenjang terlebih dahulu
                const pendaftarUsers = await db.query(`
                    SELECT DISTINCT p.id_user 
                    FROM pendaftaran p 
                    JOIN sekolah s ON p.id_sekolah_tujuan = s.id_sekolah 
                    WHERE s.id_tipe_sekolah IN (?)
                `, { 
                    replacements: [jenjangArray], 
                    type: Sequelize.QueryTypes.SELECT 
                });
                
                // Dapatkan daftar id_user pendaftar
                const pendaftarIds = pendaftarUsers.map(p => p.id_user);
                
                // Tambahkan ke options.where jika ada pendaftar yang sesuai
                if (pendaftarIds && pendaftarIds.length > 0) {
                    options.where[Op.or].push({
                        [Op.and]: [
                            { id_grup_user: 3 },
                            { id_user: { [Op.in]: pendaftarIds } }
                        ]
                    });
                }
            }
        }
        
        console.log('Query options:', JSON.stringify(options, null, 2));
        
        const users = await User.findAll(options);
        res.json(users);
    } catch (error) {
        console.error('Error in getAllUser:', error);
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data user",
            error: error.message 
        });
    }
};

// Mengambil data user berdasarkan ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id_user: req.params.id,                
            },
            include: [
                {
                    model: JenisKelamin,
                    attributes: ['id_jenis_kelamin', 'nama']
                },
                {
                    model: GrupUser,
                    attributes: ['id_grup_user', 'nama']
                },
                {
                    model: Sekolah,
                    attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                    include: [
                        {
                            model: TipeSekolah,
                            attributes: ['id_tipe_sekolah', 'nama']
                        }
                    ]
                }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data user",
            error: error.message 
        });
    }
};

// Mencari user berdasarkan nama
export const getUserByNama = async (req, res) => {
    try {
        const { nama } = req.body;
        
        if (!nama) {
            return res.status(400).json({ 
                message: "Nama user harus diisi"
            });
        }

        // Konversi input ke huruf kecil
        const namaLower = nama.toLowerCase();

        const users = await User.findAll({
            where: {                
                [Op.and]: [
                    Sequelize.where(
                        Sequelize.fn('LOWER', Sequelize.col('fullname')),
                        { [Op.like]: `%${namaLower}%` }
                    )
                ]
            },
            include: [
                {
                    model: JenisKelamin,
                    attributes: ['id_jenis_kelamin', 'nama']
                },
                {
                    model: GrupUser,
                    attributes: ['id_grup_user', 'nama']
                },
                {
                    model: Sekolah,
                    attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                    include: [
                        {
                            model: TipeSekolah,
                            attributes: ['id_tipe_sekolah', 'nama']
                        }
                    ]
                }
            ],
            order: [['fullname', 'ASC']]
        });

        if (users.length === 0) {
            return res.status(404).json({ 
                message: "User tidak ditemukan"
            });
        }

        res.json(users);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mencari user",
            error: error.message 
        });
    }
};

// Membuat user baru
export const createUser = async (req, res) => {
    uploadUser(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ 
                message: "Error saat upload file",
                error: err.message 
            });
        }

        try {
            // Cek apakah username sudah ada
            const existingUser = await User.findOne({
                where: {
                    username: req.body.username
                },
                include: [
                    {
                        model: JenisKelamin,
                        attributes: ['id_jenis_kelamin', 'nama']
                    },
                    {
                        model: GrupUser,
                        attributes: ['id_grup_user', 'nama']
                    },
                    {
                        model: Sekolah,
                        attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                        include: [
                            {
                                model: TipeSekolah,
                                attributes: ['id_tipe_sekolah', 'nama']
                            }
                        ]
                    }
                ]
            });

            if (existingUser) {
                // Hapus file foto jika ada karena user gagal dibuat
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    message: "Username sudah digunakan"
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(req.body.password, salt);
            
            // Simpan data user dengan foto jika ada
            const userData = {
                username: req.body.username,
                password: hashPassword,
                fullname: req.body.fullname,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                id_jenis_kelamin: req.body.id_jenis_kelamin,
                id_grup_user: req.body.id_grup_user,
                id_sekolah: req.body.id_sekolah,
                photo: req.file ? req.file.filename : null,
                status: 1
            };

            const user = await User.create(userData);

            // Ambil data user lengkap dengan relasinya
            const userWithRelations = await User.findOne({
                where: { id_user: user.id_user },
                include: [
                    {
                        model: JenisKelamin,
                        attributes: ['id_jenis_kelamin', 'nama']
                    },
                    {
                        model: GrupUser,
                        attributes: ['id_grup_user', 'nama']
                    },
                    {
                        model: Sekolah,
                        attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                        include: [
                            {
                                model: TipeSekolah,
                                attributes: ['id_tipe_sekolah', 'nama']
                            }
                        ]
                    }
                ]
            });
            
            res.status(201).json({
                message: "User berhasil dibuat",
                data: userWithRelations
            });
        } catch (error) {
            // Hapus file foto jika ada error saat create user
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                message: "Gagal membuat user baru",
                error: error.message
            });
        }
    });
};

// Mengupdate data user
export const updateUser = async (req, res) => {
    uploadUser(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ 
                message: "Error saat upload file",
                error: err.message 
            });
        }

        try {
            const { 
                username,
                password,
                fullname,
                phone,
                address,
                id_jenis_kelamin,
                id_grup_user,
                id_sekolah,
                status,
                email
            } = req.body;

            // Cek apakah user ada
            const user = await User.findOne({
                where: {
                    id_user: req.params.id
                },
                include: [
                    {
                        model: JenisKelamin,
                        attributes: ['id_jenis_kelamin', 'nama']
                    },
                    {
                        model: GrupUser,
                        attributes: ['id_grup_user', 'nama']
                    },
                    {
                        model: Sekolah,
                        attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                        include: [
                            {
                                model: TipeSekolah,
                                attributes: ['id_tipe_sekolah', 'nama']
                            }
                        ]
                    }
                ]
            });
            if (!user) {
                // Hapus file foto jika ada karena update gagal
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({
                    message: "User tidak ditemukan"
                });
            }

            // Jika ada foto baru, hapus foto lama
            if (req.file && user.photo) {
                const oldPhotoPath = `./content/images/user/${user.photo}`;
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            // Update user
            await user.update({
                username,
                password: password ? await bcrypt.hash(password, 10) : user.password,
                fullname,
                phone,
                address,
                id_jenis_kelamin,
                id_grup_user,
                id_sekolah,
                status,
                email,
                photo: req.file ? req.file.filename : user.photo
            });

            // Ambil data user lengkap dengan relasinya
            const userWithRelations = await User.findOne({
                where: { id_user: user.id_user },
                include: [
                    {
                        model: JenisKelamin,
                        attributes: ['id_jenis_kelamin', 'nama']
                    },
                    {
                        model: GrupUser,
                        attributes: ['id_grup_user', 'nama']
                    },
                    {
                        model: Sekolah,
                        attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                        include: [
                            {
                                model: TipeSekolah,
                                attributes: ['id_tipe_sekolah', 'nama']
                            }
                        ]
                    }
                ]
            });

            res.json({
                message: "User berhasil diupdate",
                data: userWithRelations
            });
        } catch (error) {
            // Hapus file foto jika ada error saat update
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                message: "Gagal mengupdate user",
                error: error.message
            });
        }
    });
};

// Mengubah password user
export const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ 
                message: "Password lama dan password baru harus diisi"
            });
        }

        const user = await User.findOne({
            where: {
                id_user: req.params.id,
            },
            include: [
                {
                    model: JenisKelamin,
                    attributes: ['id_jenis_kelamin', 'nama']
                },
                {
                    model: GrupUser,
                    attributes: ['id_grup_user', 'nama']
                },
                {
                    model: Sekolah,
                    attributes: ['id_sekolah', 'nama', 'npsn', 'id_tipe_sekolah'],
                    include: [
                        {
                            model: TipeSekolah,
                            attributes: ['id_tipe_sekolah', 'nama']
                        }
                    ]
                }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Verifikasi password lama
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Password lama tidak sesuai" });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await user.update({ password: hashPassword });

        res.json({ message: "Password berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat memperbarui password",
            error: error.message 
        });
    }
};

// Menghapus user (soft delete)
// Menghapus user (hard delete)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id_user: req.params.id,                
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Hapus foto user jika ada
        if (user.photo) {
            const photoPath = `./public/uploads/users/${user.photo}`;
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Hard delete user dari database
        await user.destroy();
        
        res.json({ message: "User berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat menghapus user",
            error: error.message 
        });
    }
};