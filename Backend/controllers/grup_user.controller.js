import GrupUser from "../models/grup_user.model.js";

// Controller untuk mengelola data Grup User

// Mengambil semua data grup user
export const getAllGrupUser = async (req, res) => {
    try {
        const grupUser = await GrupUser.findAll({
            order: [['id_grup_user', 'ASC']]
        });
        res.json(grupUser);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data grup user",
            error: error.message 
        });
    }
};

// Mengambil data grup user berdasarkan ID
export const getGrupUserById = async (req, res) => {
    try {
        const grupUser = await GrupUser.findByPk(req.params.id);
        if (!grupUser) {
            return res.status(404).json({ message: "Grup user tidak ditemukan" });
        }
        res.json(grupUser);
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat mengambil data grup user",
            error: error.message 
        });
    }
};

// Membuat data grup user baru
export const createGrupUser = async (req, res) => {
    try {
        // Validasi input
        if (!req.body.nama) {
            return res.status(400).json({ message: "Nama grup user tidak boleh kosong" });
        }

        const grupUser = await GrupUser.create({
            nama: req.body.nama
        });
        res.status(201).json({
            message: "Grup user berhasil dibuat",
            data: grupUser
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat membuat grup user",
            error: error.message 
        });
    }
};

// Mengupdate data grup user
export const updateGrupUser = async (req, res) => {
    try {
        // Validasi input
        if (!req.body.nama) {
            return res.status(400).json({ message: "Nama grup user tidak boleh kosong" });
        }

        const grupUser = await GrupUser.findByPk(req.params.id);
        if (!grupUser) {
            return res.status(404).json({ message: "Grup user tidak ditemukan" });
        }

        await grupUser.update({
            nama: req.body.nama
        });

        res.json({
            message: "Grup user berhasil diperbarui",
            data: grupUser
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat memperbarui grup user",
            error: error.message 
        });
    }
};

// Menghapus data grup user
export const deleteGrupUser = async (req, res) => {
    try {
        const grupUser = await GrupUser.findByPk(req.params.id);
        if (!grupUser) {
            return res.status(404).json({ message: "Grup user tidak ditemukan" });
        }

        await grupUser.destroy();
        res.json({ message: "Grup user berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ 
            message: "Terjadi kesalahan saat menghapus grup user",
            error: error.message 
        });
    }
};