import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Fungsi untuk membuat storage berdasarkan path tujuan
 * @param {string} uploadPath - Path tujuan upload (relatif ke root)
 * @param {string} prefix - Prefix untuk nama file (optional)
 * @returns {multer.StorageEngine}
 */
const createStorage = (uploadPath, prefix = '') => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            // Buat direktori jika belum ada
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
        }
    });
};

// Filter file upload (hanya gambar)
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: Hanya file gambar yang diperbolehkan!'));
};

// Konfigurasi multer untuk banner
const bannerStorage = createStorage('./content/images/banner', 'banner-');
const uploadBanner = multer({ 
    storage: bannerStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimal 5MB
    }
});

// Konfigurasi multer untuk user photo
const userStorage = createStorage('./content/images/user', 'user-');
const userUpload = multer({ 
    storage: userStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimal 5MB
    }
});

/**
 * Mendapatkan subfolder dan prefix berdasarkan jenis dokumen
 * @param {string} fieldname - Nama field dokumen
 * @returns {Object} Object berisi subfolder dan prefix
 */
const getFileConfig = (fieldname) => {
    const config = {
        'dok_kk': { folder: 'kk', prefix: 'kk' },
        'dok_ijazah': { folder: 'ijazah', prefix: 'ijazah' },
        'dok_skhun': { folder: 'skhun', prefix: 'skhun' },
        'dok_transkrip': { folder: 'transkrip', prefix: 'transkrip' },
        'dok_piagam': { folder: 'piagam', prefix: 'piagam' },
        'dok_prestasi': { folder: 'prestasi', prefix: 'prestasi' },
        'dok_skpindah': { folder: 'sk_pindah', prefix: 'sk_pindah' },
        'dok_skdomisili': { folder: 'sk_domisili', prefix: 'sk_domisili' },
        'dok_pkh': { folder: 'pkh', prefix: 'pkh' },
        'dok_kks': { folder: 'kks', prefix: 'kks' },
        'dok_kip': { folder: 'kip', prefix: 'kip' },
        'dok_kis': { folder: 'kis', prefix: 'kis' },
        'dok_foto': { folder: 'foto', prefix: 'foto' },
        'dok_akta': { folder: 'akta', prefix: 'akta' }
    };
    return config[fieldname] || { folder: 'lainnya', prefix: 'dokumen' };
};

/**
 * Konfigurasi penyimpanan file upload menggunakan multer
 * @description Mengatur lokasi penyimpanan dan format nama file
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Tentukan subfolder berdasarkan jenis dokumen
        const { folder } = getFileConfig(file.fieldname);
        const uploadDir = `./content/uploads/pendaftaran/${folder}`;
        
        // Buat folder jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Format nama file: [prefix]-[timestamp].[ext]
        const { prefix } = getFileConfig(file.fieldname);
        const timestamp = new Date().getTime();
        const ext = path.extname(file.originalname);
        cb(null, `${prefix}-${timestamp}${ext}`);
    }
});

/**
 * Filter file yang diizinkan
 * @description Hanya mengizinkan file dengan format PDF, JPG, JPEG, dan PNG
 */
const dokumenFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Hanya file PDF, JPG, JPEG, dan PNG yang diizinkan!');
    }
};

/**
 * Field untuk upload dokumen
 * @description Daftar field yang digunakan untuk upload dokumen pendaftaran
 */
const uploadFields = [
    { name: 'dok_kk', maxCount: 1 },
    { name: 'dok_ijazah', maxCount: 1 },
    { name: 'dok_skhun', maxCount: 1 },
    { name: 'dok_transkrip', maxCount: 1 },
    { name: 'dok_piagam', maxCount: 1 },
    { name: 'dok_prestasi', maxCount: 1 },
    { name: 'dok_skpindah', maxCount: 1 },
    { name: 'dok_skdomisili', maxCount: 1 },
    { name: 'dok_foto', maxCount: 1 },
    { name: 'dok_pkh', maxCount: 1 },
    { name: 'dok_kks', maxCount: 1 },
    { name: 'dok_kip', maxCount: 1 },
    { name: 'dok_kis', maxCount: 1 },
    { name: 'dok_akta', maxCount: 1 }
];

/**
 * Konfigurasi upload file
 * @description Inisialisasi multer dengan konfigurasi storage, filter, dan batasan ukuran file
 */
const uploadDokumen = multer({
    storage: storage,
    fileFilter: dokumenFileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // Maksimal 2MB
    }
});

// Export middleware untuk banner
export default uploadBanner;

// Export middleware untuk user photo
export const uploadUser = userUpload.single('photo');

// Export middleware untuk dokumen
export const uploadDokumenFields = uploadDokumen.fields(uploadFields);