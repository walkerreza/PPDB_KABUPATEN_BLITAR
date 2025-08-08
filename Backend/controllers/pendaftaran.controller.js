import Pendaftaran from "../models/pendaftaran.model.js";
import User from "../models/user.model.js";
import JenisKelamin from "../models/jenis_kelamin.model.js";
import Provinsi from "../models/provinsi.model.js";
import KabupatenKota from "../models/kabupaten_kota.model.js";
import Kecamatan from "../models/kecamatan.model.js";
import Kelurahan from "../models/kelurahan.model.js";
import JalurPendaftaran from "../models/jalur_pendaftaran.model.js";
import Sekolah from "../models/sekolah.model.js";
import TipeSekolah from "../models/tipe_sekolah.model.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import fs from "fs";
import { uploadDokumenFields } from "../config/multer.config.js";
import multer from "multer";
import moment from 'moment-timezone';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Sequelize } from "sequelize";

// Set timezone untuk Jakarta
moment.tz.setDefault('Asia/Jakarta');

// Fungsi untuk format tanggall
const formatDate = (date) => {
    if (!date) return null;
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Format data pendaftaran sebelum dikirim
const formatPendaftaranResponse = (pendaftaran) => {
    if (Array.isArray(pendaftaran)) {
        return pendaftaran.map(item => ({
            ...item.get({ plain: true }),
            waktu_daftar: formatDate(item.waktu_daftar)
        }));
    }
    const plainPendaftaran = pendaftaran.get({ plain: true });
    return {
        ...plainPendaftaran,
        waktu_daftar: formatDate(pendaftaran.waktu_daftar)
    };
};

/**
 * Membuat nomor pendaftaran otomatis
 * Format: XX-YYY-ZZZZZZZZ
 * XX = level sekolah asal (01=TK, 02=SD)
 * YYY = id sekolah tujuan
 * ZZZZZZZZ = timestamp (bulan(1), tanggal(1), jam(2), menit(2), detik(2))
 * @param {number} tipeSekolahId - ID tipe sekolah asal
 * @param {number} sekolahTujuanId - ID sekolah tujuan
 * @returns {string} Format: 01-001-12083649
 */
export const generateNoPendaftaran = async (tipeSekolahId, sekolahTujuanId) => {
    // Menentukan 2 digit pertama berdasarkan tipe sekolah
    const levelSekolah = tipeSekolahId === 1 ? "01" : "02"; // 01 untuk TK, 02 untuk SD

    // Mengambil 3 digit id sekolah tujuan
    const idSekolahTujuan = String(sekolahTujuanId);

    // Mengambil timestamp untuk 8 digit terakhir
    const now = moment();
    const bulan = now.format("M"); // 1-12
    const tanggal = now.format("D"); // 1-31
    const jam = now.format("HH");
    const menit = now.format("mm");
    const detik = now.format("ss");

    // Menggabungkan timestamp
    const timestamp = `${bulan}${tanggal}${jam}${menit}${detik}`;

    // Menggabungkan semua komponen dengan pemisah "-"
    const noPendaftaran = `${levelSekolah}-${idSekolahTujuan}-${timestamp}`;

    return noPendaftaran;
}

/**
 * Membuat pendaftaran baru
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createPendaftaran = async (req, res) => {
    try {
        const { nik, nama_siswa, email, id_jenis_kelamin, id_sekolah_tujuan, id_jalur_pendaftaran, is_diterima, ...pendaftaranData } = req.body;

        // Validasi data wajib
        if (!nik || !nama_siswa || !id_jenis_kelamin || !id_sekolah_tujuan || !id_jalur_pendaftaran) {
            return res.status(400).json({
                success: false,
                message: "Data wajib (NIK, nama siswa, jenis kelamin, sekolah tujuan, dan jalur pendaftaran) harus diisi"
            });
        }

        // Validasi id_jenis_kelamin
        if (!id_jenis_kelamin) {
            return res.status(400).json({
                success: false,
                message: "id_jenis_kelamin harus diisi"
            });
        }

        // Cek apakah NIK sudah terdaftar
        const existingPendaftaran = await Pendaftaran.findOne({
            where: { nik }
        });

        if (existingPendaftaran) {
            return res.status(400).json({
                success: false,
                message: "NIK sudah terdaftar"
            });
        }

        // Cek apakah NIK sudah digunakan sebagai username
        const existingUser = await User.findOne({
            where: { username: nik }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "NIK sudah terdaftar sebagai pengguna dalam sistem"
            });
        }

        // Cek ketersediaan pagu
        const paguTersedia = await cekPaguSekolah(id_sekolah_tujuan, id_jalur_pendaftaran);
        if (!paguTersedia) {
            return res.status(400).json({
                success: false,
                message: "Mohon maaf, kuota untuk jalur pendaftaran ini sudah penuh"
            });
        }

        // Generate nomor pendaftaran otomatis
        const no_pendaftaran = await generateNoPendaftaran(1, id_sekolah_tujuan);

        // Buat user terlebih dahulu
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(nik, salt);

        const user = await User.create({
            fullname: nama_siswa,
            email: email || null,
            username: nik,
            password: hashPassword,
            id_grup_user: 3,
            id_jenis_kelamin: parseInt(id_jenis_kelamin),
            status: 1,
            phone: pendaftaranData.nomor_telepon,
            address: pendaftaranData.alamat
        });

        try {
            // Buat pendaftaran dengan id_user dan id_sekolah_tujuan
            const pendaftaran = await Pendaftaran.create({
                no_pendaftaran,
                nik,
                nama_siswa,
                id_user: user.id_user,
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jenis_kelamin: parseInt(id_jenis_kelamin),
                id_jalur_pendaftaran: parseInt(id_jalur_pendaftaran),
                waktu_daftar: moment().format('YYYY-MM-DD HH:mm:ss'),
                // sesuai_titik_dapodik: 0,
                is_diterima: 0, 
                ...pendaftaranData
            });

            // Ambil data pendaftaran dengan include user
            const pendaftaranWithUser = await Pendaftaran.findOne({
                where: { id_pendaftaran: pendaftaran.id_pendaftaran },
                include: [
                    { model: User, attributes: ['id_user', 'username', 'password', 'fullname', 'email', 'phone', 'address', 'status'] },
                    { model: JenisKelamin, attributes: ['nama'] },
                    { model: Provinsi, attributes: ['nama_provinsi'] },
                    { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                    { model: Kecamatan, attributes: ['nama_kecamatan'] },
                    { model: Kelurahan, attributes: ['nama_kelurahan'] },
                    { model: JalurPendaftaran, attributes: ['nama'] },
                    { model: TipeSekolah, attributes: ['slug'] },
                    { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                    { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
                ]
            });

            res.status(201).json({
                success: true,
                message: "Pendaftaran berhasil dibuat",
                data: {
                    ...formatPendaftaranResponse(pendaftaranWithUser)
                }
            });
        } catch (pendaftaranError) {
            // Jika gagal membuat pendaftaran, hapus user
            await user.destroy();
            throw new Error("Gagal membuat pendaftaran: " + pendaftaranError.message);
        }
    } catch (error) {
        // Jika terjadi error setelah membuat user, hapus user tersebut
        if (error.pendaftaran && error.user) {
            await User.destroy({
                where: { id_user: error.user.id_user }
            });
        }

        // Tampilkan detail error validasi
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: "Validasi gagal",
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        console.error('Error detail:', error); // Tambahkan log error untuk debugging

        res.status(500).json({
            success: false,
            message: "Gagal membuat pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mengecek ketersediaan pagu untuk jalur pendaftaran tertentu
 * @param {number} idSekolahTujuan - ID sekolah tujuan
 * @param {number} idJalurPendaftaran - ID jalur pendaftaran
 * @returns {Promise<boolean>} true jika masih tersedia pagu, false jika sudah penuh
 */
const cekPaguSekolah = async (idSekolahTujuan, idJalurPendaftaran) => {
    try {
        // Ambil data sekolah untuk mendapatkan kuota jalur
        const sekolah = await Sekolah.findByPk(idSekolahTujuan);
        if (!sekolah) throw new Error('Sekolah tidak ditemukan');

        // Tentukan field kuota berdasarkan jalur
        let kuotaField;
        switch (idJalurPendaftaran) {
            case 1: // Zonasi
                kuotaField = 'zonasi';
                break;
            case 2: // Prestasi
                kuotaField = 'prestasi';
                break;
            case 3: // Pindahan
                kuotaField = 'pindahan';
                break;
            case 4: // Afirmasi
                kuotaField = 'afirmasi';
                break;
            case 5: // Reguler
                kuotaField = 'reguler';
                break;
            default:
                throw new Error('Jalur pendaftaran tidak valid');
        }

        // Hitung jumlah pendaftar pada sekolah tujuan berdasarkan jalur
        const jumlahPendaftar = await Pendaftaran.count({
            where: {
                id_sekolah_tujuan: idSekolahTujuan,
                id_jalur_pendaftaran: idJalurPendaftaran,
            }
        });

        // Cek apakah masih ada kuota tersedia
        return jumlahPendaftar < sekolah[kuotaField];
    } catch (error) {
        console.error('Error saat cek pagu:', error);
        throw error;
    }
};

/**
 * Mengambil semua data pendaftaran
 */
export const getAllPendaftaran = async (req, res) => {
    try {
        const pendaftaran = await Pendaftaran.findAll({
            include: [
                { model: User, attributes: ['id_user', 'username', 'fullname', 'email', 'phone', 'address', 'status'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ],
            order: [['waktu_daftar', 'ASC']]
        });
        res.json({
            success: true,
            message: "Data pendaftaran berhasil diambil",
            data: formatPendaftaranResponse(pendaftaran)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Mengambil data pendaftaran berdasarkan ID
 */
export const getPendaftaranById = async (req, res) => {
    try {
        const pendaftaran = await Pendaftaran.findOne({
            where: {
                id_pendaftaran: req.params.id
            },
            include: [
                { model: User, attributes: ['id_user', 'username', 'fullname', 'email', 'phone', 'address', 'status'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ]
        });

        if (!pendaftaran) {
            return res.status(404).json({
                success: false,
                message: "Pendaftaran tidak ditemukan"
            });
        }

        res.json({
            success: true,
            message: "Data pendaftaran berhasil diambil",
            data: formatPendaftaranResponse(pendaftaran)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Mengupdate data pendaftaran dan upload dokumen
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updatePendaftaranPendaftar = async (req, res) => {
    try {
        uploadDokumenFields(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: "Error saat upload file",
                    error: err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err
                });
            }

            // Log data yang diterima untuk debugging
            console.log('Data yang diterima dari frontend:', req.body);
            console.log('ID pendaftaran yang akan diupdate:', req.params.id);

            const pendaftaran = await Pendaftaran.findByPk(req.params.id);

            if (!pendaftaran) {
                // Hapus file yang sudah diupload jika pendaftaran tidak ditemukan
                if (req.files) {
                    Object.keys(req.files).forEach(fieldname => {
                        const files = req.files[fieldname];
                        files.forEach(file => {
                            fs.unlinkSync(file.path);
                        });
                    });
                }

                return res.status(404).json({
                    success: false,
                    message: "Pendaftaran tidak ditemukan"
                });
            }

            // Update data pendaftaran
            const updatedData = {
                nik: req.body.nik,
                nisn: req.body.nisn,
                nama_siswa: req.body.nama_lengkap, // Mengubah nama_lengkap menjadi nama_siswa
                tempat_lahir: req.body.tempat_lahir,
                tanggal_lahir: req.body.tanggal_lahir,
                id_jenis_kelamin: parseInt(req.body.id_jenis_kelamin),
                nama_ayah: req.body.nama_ayah,
                nama_ibu: req.body.nama_ibu,
                nomor_telepon: req.body.nomor_telepon,
                id_provinsi: req.body.id_provinsi,
                id_kabupaten_kota: req.body.id_kabupaten_kota,
                id_kecamatan: req.body.id_kecamatan,
                id_kelurahan: req.body.id_kelurahan,
                alamat: req.body.alamat,
                id_tipe_sekolah_asal: parseInt(req.body.id_tipe_sekolah_asal),
                id_sekolah_asal: parseInt(req.body.id_sekolah_asal),
                nilai_bhs_indonesia: parseFloat(req.body.nilai_bhs_indonesia),
                nilai_matematika: parseFloat(req.body.nilai_matematika),
                nilai_ipa: parseFloat(req.body.nilai_ipa),
                id_sekolah_tujuan: parseInt(req.body.id_sekolah_tujuan)
            };

            // Jika ada file yang diupload
            if (req.files) {
                // Konfigurasi folder untuk setiap jenis dokumen
                const dokumenConfig = {
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
                    'dok_akta' : {folder: 'akta', prefix :'akta'}
                };

                // Hanya proses file yang diupload
                Object.keys(req.files).forEach(fieldname => {
                    const files = req.files[fieldname];
                    const config = dokumenConfig[fieldname] || { folder: 'lainnya', prefix: 'dokumen' };

                    // Pastikan folder ada
                    const uploadPath = `./content/uploads/pendaftaran/${config.folder}`;
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }

                    // Hapus file lama jika ada
                    if (pendaftaran[fieldname] && fs.existsSync(`${uploadPath}/${pendaftaran[fieldname]}`)) {
                        fs.unlinkSync(`${uploadPath}/${pendaftaran[fieldname]}`);
                    }

                    // Update path file baru di database
                    updatedData[fieldname] = files[0].filename;
                });
            }

            console.log('Data yang akan diupdate ke database:', updatedData);

            try {
                await pendaftaran.update(updatedData);
                console.log('Update berhasil');
            } catch (updateError) {
                console.error('Error saat update data:', updateError);
                return res.status(500).json({
                    success: false,
                    message: "Gagal mengupdate data pendaftaran",
                    error: updateError.message
                });
            }

            // Ambil data pendaftaran yang sudah diupdate
            const updatedPendaftaran = await Pendaftaran.findOne({
                where: { id_pendaftaran: req.params.id },
                include: [
                    { model: User, attributes: ['id_user', 'username', 'fullname', 'email', 'phone', 'address', 'status'] },
                    { model: JenisKelamin, attributes: ['nama'] },
                    { model: Provinsi, attributes: ['nama_provinsi'] },
                    { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                    { model: Kecamatan, attributes: ['nama_kecamatan'] },
                    { model: Kelurahan, attributes: ['nama_kelurahan'] },
                    { model: JalurPendaftaran, attributes: ['nama'] },
                    { model: TipeSekolah, attributes: ['slug'] },
                    { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                    { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
                ]
            });

            res.json({
                success: true,
                message: "Pendaftaran berhasil diupdate",
                data: formatPendaftaranResponse(updatedPendaftaran)
            });
        });
    } catch (error) {
        console.error('Error updating pendaftaran:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengupdate pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mengekspor data pendaftaran ke Excel
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const exportToExcel = async (req, res) => {
    try {
        // Mengambil semua data pendaftaran dengan relasi yang diperlukan
        const pendaftaranData = await Pendaftaran.findAll({
            include: [
                { model: User, attributes: ['fullname'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ],
            order: [['waktu_daftar', 'ASC']]
        });

        // Log untuk debugging
        console.log('Jumlah data pendaftaran:', pendaftaranData.length);
        if (pendaftaranData.length > 0) {
            console.log('Contoh data pertama:', JSON.stringify(pendaftaranData[0], null, 2));
        }

        // Membuat workbook dan worksheet baru
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Pendaftaran');

        // Menambahkan judul
        worksheet.mergeCells('A1:O1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'PPDB KABUPATEN BLITAR';
        titleCell.font = {
            size: 16,
            bold: true
        };
        titleCell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };

        // Mengatur lebar kolom
        worksheet.columns = [
            { width: 20 }, // No Pendaftaran
            { width: 20 }, // NIK
            { width: 15 }, // NISN
            { width: 30 }, // Nama Siswa
            { width: 15 }, // Jenis Kelamin
            { width: 20 }, // Tempat Lahir
            { width: 15 }, // Tanggal Lahir
            { width: 30 }, // Nama Ayah
            { width: 30 }, // Nama Ibu
            // { width: 30 }, // Nama Orang Tua (backup)
            { width: 15 }, // No. HP
            { width: 40 }, // Alamat
            { width: 20 }, // Provinsi
            { width: 20 }, // Kabupaten/Kota
            { width: 20 }, // Kecamatan
            { width: 20 }, // Kelurahan
            { width: 15 }, // Longitude
            { width: 15 }, // Latitude
            { width: 20 }, // Jalur Pendaftaran
            { width: 20 }, // Tipe Sekolah Asal
            { width: 40 }, // Sekolah Asal
            { width: 15 }, // Tahun Lulus
            { width: 40 }, // Sekolah Tujuan
            { width: 20 }, // Jarak ke Sekolah (km)
            { width: 18 }, // Nilai B. Indonesia
            { width: 18 }, // Nilai B. Inggris
            { width: 18 }, // Nilai Matematika
            { width: 18 }, // Nilai IPA
            { width: 20 }  // Waktu Daftar
        ];

        // Menambahkan header kolom (pindah ke baris 3 karena judul di baris 1)
        worksheet.getRow(3).values = [
            'No Pendaftaran',
            'NIK',
            'NISN',
            'Nama Siswa',
            'Jenis Kelamin',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Nama Ayah',
            'Nama Ibu',
            // 'Nama Orang Tua',
            'No. HP',
            'Alamat',
            'Provinsi',
            'Kabupaten/Kota',
            'Kecamatan',
            'Kelurahan',
            'Longitude',
            'Latitude',
            'Jalur Pendaftaran',
            'Tipe Sekolah Asal',
            'Sekolah Asal',
            'Tahun Lulus',
            'Sekolah Tujuan',
            'Jarak ke Sekolah (km)',
            'Nilai B. Indonesia',
            'Nilai B. Inggris',
            'Nilai Matematika',
            'Nilai IPA',
            'Waktu Daftar'
        ];

        // Mengatur style untuk header
        const headerRow = worksheet.getRow(3);
        headerRow.font = {
            bold: true
        };
        headerRow.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Mengisi data (mulai dari baris 4 karena header di baris 3)
        let rowIndex = 4;
        pendaftaranData.forEach(data => {
            worksheet.getRow(rowIndex).values = [
                data.no_pendaftaran,
                data.nik,
                data.nisn,
                data.nama_siswa,
                data.jenis_kelamin?.nama || '',
                data.tempat_lahir,
                moment(data.tanggal_lahir).format('DD/MM/YYYY'),
                data.nama_ayah,
                data.nama_ibu,
                // data.nama_orang_tua, // backup
                data.nomor_telepon,
                data.alamat,
                data.provinsi?.nama_provinsi || '',
                data.kabupaten_kotum?.nama_kabupaten_kota || '',
                data.kecamatan?.nama_kecamatan || '',
                data.kelurahan?.nama_kelurahan || '',
                data.longitude,
                data.latitude,
                data.jalur_pendaftaran?.nama || '',
                data.tipe_sekolah?.slug || '',
                data.sekolah_asal || data.sekolah_asal_data?.nama || '',
                data.tahun_lulus,
                data.sekolah_tujuan_data?.nama || '',
                data.jarak_sekolah_tujuan,
                data.nilai_bhs_indonesia,
                data.nilai_bhs_inggris,
                data.nilai_matematika,
                data.nilai_ipa,
                moment(data.waktu_daftar).format('DD/MM/YYYY HH:mm:ss')
            ];
            rowIndex++;
        });

        // Mengatur border untuk semua sel yang berisi data
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Set response headers untuk download file
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Data_Pendaftaran_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
        );

        // Mengirim file excel sebagai response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error detail:', error); // Tambahkan log error untuk debugging

        res.status(500).json({
            success: false,
            message: "Gagal membuat pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mengekspor data pendaftaran ke format CSV
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description
 * Endpoint ini memungkinkan ekspor data pendaftaran ke format CSV.
 * Data dapat difilter berdasarkan sekolah tujuan menggunakan parameter query id_sekolah_tujuan.
 * 
 * Contoh penggunaan:
 * - Ekspor semua data: GET /api/pendaftaran/export/csv
 * - Ekspor data berdasarkan sekolah tujuan: GET /api/pendaftaran/export/csv?id_sekolah_tujuan=1
 * 
 * File CSV yang dihasilkan akan berisi kolom-kolom berikut:
 * - No Pendaftaran
 * - NIK
 * - NISN
 * - Nama Siswa
 * - dan kolom-kolom lainnya
 */
export const exportToCSV = async (req, res) => {
    try {
        // Mengambil id_sekolah_tujuan dari query parameter
        const { id_sekolah_tujuan } = req.query;

        // Menyiapkan where clause untuk filter
        const whereClause = id_sekolah_tujuan ? { id_sekolah_tujuan } : {};

        // Mengambil semua data pendaftaran dengan relasi yang diperlukan
        const pendaftaranData = await Pendaftaran.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['fullname'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ],
            order: [['waktu_daftar', 'ASC']]
        });

        // Log untuk debugging
        console.log('Jumlah data pendaftaran:', pendaftaranData.length);
        if (pendaftaranData.length > 0) {
            console.log('Contoh data pertama:', JSON.stringify(pendaftaranData[0], null, 2));
        }

        // Header untuk file CSV
        const headers = [
            'No Pendaftaran',
            'NIK',
            'NISN',
            'Nama Siswa',
            'Jenis Kelamin',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Nama Ayah',
            'Nama Ibu',
            // 'Nama Orang Tua', // backup
            'No. HP',
            'Alamat',
            'Provinsi',
            'Kabupaten/Kota',
            'Kecamatan',
            'Kelurahan',
            'Longitude',
            'Latitude',
            'Jalur Pendaftaran',
            'Tipe Sekolah Asal',
            'Sekolah Asal',
            'Tahun Lulus',
            'Sekolah Tujuan',
            'Jarak ke Sekolah (km)',
            'Nilai B. Indonesia',
            'Nilai B. Inggris',
            'Nilai Matematika',
            'Nilai IPA',
            'Waktu Daftar'
        ].join(',') + '\n';

        // Mengubah data ke format CSV
        let csvContent = headers;
        pendaftaranData.forEach(data => {
            const row = [
                data.no_pendaftaran,
                data.nik,
                data.nisn,
                data.nama_siswa,
                data.jenis_kelamin?.nama || '',
                data.tempat_lahir,
                moment(data.tanggal_lahir).format('DD/MM/YYYY'),
                data.nama_ayah,
                data.nama_ibu,
                // data.nama_orang_tua, // backup
                data.nomor_telepon,
                `"${data.alamat}"`,
                data.provinsi?.nama_provinsi || '',
                data.kabupaten_kotum?.nama_kabupaten_kota || '',
                data.kecamatan?.nama_kecamatan || '',
                data.kelurahan?.nama_kelurahan || '',
                data.longitude,
                data.latitude,
                data.jalur_pendaftaran?.nama || '',
                data.tipe_sekolah?.slug || '',
                data.sekolah_asal || data.sekolah_asal_data?.nama || '',
                data.tahun_lulus,
                data.sekolah_tujuan_data?.nama || '',
                data.jarak_sekolah_tujuan,
                data.nilai_bhs_indonesia,
                data.nilai_bhs_inggris,
                data.nilai_matematika,
                data.nilai_ipa,
                moment(data.waktu_daftar).format('DD/MM/YYYY HH:mm:ss')
            ].join(',') + '\n';
            csvContent += row;
        });

        // Mengatur header response
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Data_Pendaftaran_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`
        );

        // Mengirim file CSV
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Error saat mengekspor data:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengekspor data ke CSV',
            error: error.message
        });
    }
};

/**
 * Mengekspor data pendaftaran ke format PDF
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description
 * Endpoint ini memungkinkan ekspor data pendaftaran ke format PDF.
 * Data dapat difilter berdasarkan sekolah tujuan menggunakan parameter query id_sekolah_tujuan.
 * 
 * Contoh penggunaan:
 * - Ekspor semua data: GET /api/pendaftaran/export/pdf
 * - Ekspor data berdasarkan sekolah tujuan: GET /api/pendaftaran/export/pdf?id_sekolah_tujuan=1
 * 
 * PDF yang dihasilkan akan berisi informasi:
 * - No Pendaftaran
 * - NIK
 * - NISN
 * - Nama Siswa
 * - dan informasi lainnya yang diformat dalam bentuk tabel
 */
export const exportToPDF = async (req, res) => {
    try {
        // Mengambil id_sekolah_tujuan dari query parameter
        const { id_sekolah_tujuan } = req.query;

        // Menyiapkan where clause untuk filter
        const whereClause = id_sekolah_tujuan ? { id_sekolah_tujuan } : {};

        // Mengambil semua data pendaftaran dengan relasi yang diperlukan
        const pendaftaranData = await Pendaftaran.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['fullname'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ],
            order: [['waktu_daftar', 'ASC']]
        });

        // Log untuk debugging
        console.log('Jumlah data pendaftaran:', pendaftaranData.length);
        if (pendaftaranData.length > 0) {
            console.log('Contoh data pertama:', JSON.stringify(pendaftaranData[0], null, 2));
        }

        // Membuat dokumen PDF
        const doc = new PDFDocument();
        const filename = `Data_Pendaftaran_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;

        // Mengatur header response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
        );

        // Pipe PDF ke response
        doc.pipe(res);

        // Menambahkan judul
        doc.fontSize(16).text('Data Pendaftaran PPDB', { align: 'center' });
        doc.moveDown();

        // Definisi kolom
        const tableHeaders = [
            'No Pendaftaran',
            'NIK',
            'NISN',
            'Nama Siswa',
            'Jenis Kelamin',
            'Tempat/Tgl Lahir',
            'Nama Ayah',
            'Nama Ibu',
            // 'Nama Orang Tua', // backup
            'No. HP',
            'Alamat',
            'Jalur Pendaftaran',
            'Sekolah Asal',
            'Sekolah Tujuan',
            'Nilai Rata-rata'
        ];

        // Mengatur posisi awal
        let y = 150;
        const rowHeight = 30;
        const pageHeight = doc.page.height - 50;

        // Fungsi untuk membuat header tabel
        const createTableHeader = () => {
            doc.fontSize(10);
            let x = 50;
            tableHeaders.forEach(header => {
                doc.text(header, x, y);
                x += 100;
            });
            y += rowHeight;
        };

        createTableHeader();

        // Menambahkan data ke PDF
        pendaftaranData.forEach(data => {
            // Cek jika perlu halaman baru
            if (y > pageHeight - rowHeight) {
                doc.addPage();
                y = 50;
                createTableHeader();
            }

            // Menghitung nilai rata-rata
            const nilaiRata = (
                (parseFloat(data.nilai_bhs_indonesia) || 0) +
                (parseFloat(data.nilai_bhs_inggris) || 0) +
                (parseFloat(data.nilai_matematika) || 0) +
                (parseFloat(data.nilai_ipa) || 0)
            ) / 4;

            // Menulis data ke PDF
            let x = 50;
            doc.fontSize(8);
            doc.text(data.no_pendaftaran, x, y); x += 100;
            doc.text(data.nik, x, y); x += 100;
            doc.text(data.nisn, x, y); x += 100;
            doc.text(data.nama_siswa, x, y); x += 100;
            doc.text(data.jenis_kelamin?.nama || '', x, y); x += 100;
            doc.text(`${data.tempat_lahir}, ${moment(data.tanggal_lahir).format('DD/MM/YYYY')}`, x, y); x += 100;
            // doc.text(data.nama_orang_tua, x, y); x += 100; // backup
            doc.text(data.nama_ayah, x, y); x += 100;
            doc.text(data.nama_ibu, x, y); x += 100;
            doc.text(data.nomor_telepon, x, y); x += 100;
            doc.text(`${data.alamat}, ${data.kelurahan?.nama_kelurahan}, ${data.kecamatan?.nama_kecamatan}`, x, y); x += 100;
            doc.text(data.jalur_pendaftaran?.nama || '', x, y); x += 100;
            doc.text(data.sekolah_asal || data.sekolah_asal_data?.nama || '', x, y); x += 100;
            doc.text(data.sekolah_tujuan_data?.nama || '', x, y); x += 100;
            doc.text(nilaiRata.toFixed(2), x, y);

            y += rowHeight;
        });

        // Menambahkan footer
        doc.fontSize(8)
            .text(
                `Diekspor pada: ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
                50,
                doc.page.height - 50,
                { align: 'left' }
            );

        // Finalisasi dokumen PDF
        doc.end();

    } catch (error) {
        console.error('Error saat mengekspor data:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengekspor data ke PDF',
            error: error.message
        });
    }
};

/**
 * Mengekspor data pendaftaran ke format Excel berdasarkan sekolah tujuan
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @description
 * Endpoint ini memungkinkan ekspor data pendaftaran ke format Excel berdasarkan sekolah tujuan.
 * Parameter id_sekolah_tujuan wajib diisi.
 * 
 * Contoh penggunaan:
 * - Ekspor data sekolah tertentu: GET /api/pendaftaran/export/excel/sekolah/:id_sekolah_tujuan
 * 
 * File Excel yang dihasilkan akan berisi worksheet dengan kolom-kolom:
 * - No Pendaftaran
 * - NIK
 * - NISN
 * - Nama Siswa
 * - dan kolom-kolom lainnya
 */
export const exportToExcelBySekolah = async (req, res) => {
    try {
        const { id_sekolah_tujuan } = req.params;

        if (!id_sekolah_tujuan) {
            return res.status(400).json({
                success: false,
                message: "Parameter id_sekolah_tujuan wajib diisi"
            });
        }

        // Mengambil data sekolah tujuan untuk nama file
        const sekolahTujuan = await Sekolah.findByPk(id_sekolah_tujuan);
        if (!sekolahTujuan) {
            return res.status(404).json({
                success: false,
                message: "Data untuk sekolah tujuan tersebut tidak ditemukan"
            });
        }

        // Mengambil data pendaftaran dengan relasi yang diperlukan
        const pendaftaranData = await Pendaftaran.findAll({
            where: { id_sekolah_tujuan },
            include: [
                { model: User, attributes: ['fullname'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ],
            order: [['waktu_daftar', 'ASC']]
        });

        // Membuat workbook baru
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Pendaftaran');

        // Menambahkan header
        worksheet.columns = [
            { header: 'No Pendaftaran', key: 'no_pendaftaran', width: 20 },
            { header: 'NIK', key: 'nik', width: 20 },
            { header: 'NISN', key: 'nisn', width: 15 },
            { header: 'Nama Siswa', key: 'nama_siswa', width: 30 },
            { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 15 },
            { header: 'Tempat Lahir', key: 'tempat_lahir', width: 20 },
            { header: 'Tanggal Lahir', key: 'tanggal_lahir', width: 15 },
            // { header: 'Nama Orang Tua', key: 'nama_orang_tua', width: 30 }, // backup
            { header: 'Nama Ayah', key: 'nama_ayah', width: 30 },
            { header: 'Nama Ibu', key: 'nama_ibu', width: 30 },
            { header: 'No. HP', key: 'nomor_telepon', width: 15 },
            { header: 'Alamat', key: 'alamat', width: 40 },
            { header: 'Provinsi', key: 'provinsi', width: 20 },
            { header: 'Kabupaten/Kota', key: 'kabupaten_kota', width: 20 },
            { header: 'Kecamatan', key: 'kecamatan', width: 20 },
            { header: 'Kelurahan', key: 'kelurahan', width: 20 },
            { header: 'Jalur Pendaftaran', key: 'jalur_pendaftaran', width: 20 },
            { header: 'Sekolah Asal', key: 'sekolah_asal', width: 30 },
            { header: 'Tahun Lulus', key: 'tahun_lulus', width: 15 },
            { header: 'Nilai B. Indonesia', key: 'nilai_bhs_indonesia', width: 15 },
            { header: 'Nilai B. Inggris', key: 'nilai_bhs_inggris', width: 15 },
            { header: 'Nilai Matematika', key: 'nilai_matematika', width: 15 },
            { header: 'Nilai IPA', key: 'nilai_ipa', width: 15 },
            { header: 'Waktu Daftar', key: 'waktu_daftar', width: 20 }
        ];

        // Style untuk header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Menambahkan data
        pendaftaranData.forEach(data => {
            worksheet.addRow({
                no_pendaftaran: data.no_pendaftaran,
                nik: data.nik,
                nisn: data.nisn,
                nama_siswa: data.nama_siswa,
                jenis_kelamin: data.jenis_kelamin?.nama,
                tempat_lahir: data.tempat_lahir,
                tanggal_lahir: moment(data.tanggal_lahir).format('DD/MM/YYYY'),
                nama_ayah: data.nama_ayah,
                nama_ibu: data.nama_ibu,
                // nama_orang_tua: data.nama_orang_tua, // backup
                nomor_telepon: data.nomor_telepon,
                alamat: data.alamat,
                provinsi: data.provinsi?.nama_provinsi,
                kabupaten_kota: data.kabupaten_kotum?.nama_kabupaten_kota,
                kecamatan: data.kecamatan?.nama_kecamatan,
                kelurahan: data.kelurahan?.nama_kelurahan,
                jalur_pendaftaran: data.jalur_pendaftaran?.nama,
                sekolah_asal: data.sekolah_asal || data.sekolah_asal_data?.nama,
                tahun_lulus: data.tahun_lulus,
                nilai_bhs_indonesia: data.nilai_bhs_indonesia,
                nilai_bhs_inggris: data.nilai_bhs_inggris,
                nilai_matematika: data.nilai_matematika,
                nilai_ipa: data.nilai_ipa,
                waktu_daftar: moment(data.waktu_daftar).format('DD/MM/YYYY HH:mm:ss')
            });
        });

        // Mengatur response header
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Data_Pendaftaran_${sekolahTujuan.nama.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
        );

        // Mengirim file
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error saat mengekspor data:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengekspor data ke Excel',
            error: error.message
        });
    }
};

/**
 * Mengkonfirmasi penerimaan pendaftaran
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const konfirmasiPenerimaan = async (req, res) => {
    try {
        // Log raw parameter sebelum konversi
        console.log('Raw ID parameter:', req.params.id);
        console.log('Request body:', req.body);

        const id_pendaftaran = parseInt(req.params.id); // Konversi ke integer
        console.log('ID setelah konversi:', id_pendaftaran, 'Tipe:', typeof id_pendaftaran);

        if (isNaN(id_pendaftaran)) {
            console.log('ID tidak valid:', req.params.id);
            return res.status(400).json({
                success: false,
                message: "ID pendaftaran tidak valid",
                detail: `Nilai yang diterima: ${req.params.id} (${typeof req.params.id})`
            });
        }

        // Cek apakah pendaftaran ada dengan where clause
        const pendaftaran = await Pendaftaran.findOne({
            where: {
                id_pendaftaran: id_pendaftaran
            }
        });

        console.log('Data pendaftaran yang ditemukan:',
            pendaftaran ?
                `ID: ${pendaftaran.id_pendaftaran}, Status: ${pendaftaran.is_diterima}` :
                'Tidak ditemukan'
        );

        if (!pendaftaran) {
            return res.status(404).json({
                success: false,
                message: "Data pendaftaran tidak ditemukan",
                detail: {
                    id_yang_dicari: id_pendaftaran,
                    tipe_data: typeof id_pendaftaran
                }
            });
        }

        // Update status penerimaan dengan nilai integer
        const updateResult = await pendaftaran.update({
            is_diterima: 1, // Menggunakan 1 untuk true karena kolom bertipe INTEGER
            waktu_diterima: moment().toDate()
        });

        console.log('Hasil update:', updateResult ? 'Berhasil' : 'Gagal');

        // Format response
        const updatedPendaftaran = {
            ...pendaftaran.get({ plain: true }),
            waktu_daftar: formatDate(pendaftaran.waktu_daftar),
            waktu_diterima: formatDate(pendaftaran.waktu_diterima)
        };

        res.status(200).json({
            success: true,
            message: "Konfirmasi penerimaan berhasil",
            data: updatedPendaftaran
        });

    } catch (error) {
        console.error('Error detail:', {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat konfirmasi penerimaan",
            detail: error.message
        });
    }
};

/**
 * Menghapus data pendaftaran
 */
export const deletePendaftaran = async (req, res) => {
    try {
        const pendaftaran = await Pendaftaran.findByPk(req.params.id);

        if (!pendaftaran) {
            return res.status(404).json({
                success: false,
                message: "Pendaftaran tidak ditemukan"
            });
        }

        // Hapus file dokumen jika ada
        const dokumenFields = [
            'dok_kk', 'dok_ijazah', 'dok_skhun', 'dok_transkrip',
            'dok_piagam', 'dok_prestasi', 'dok_skpindah', 'dok_skdomisili', 'dok_pkh', 'dok_kks', 'dok_kip', 'dok_kis', 'dok_foto'
        ];

        dokumenFields.forEach(field => {
            const subfolder = {
                'dok_kk': 'kk',
                'dok_ijazah': 'ijazah',
                'dok_skhun': 'skhun',
                'dok_transkrip': 'transkrip',
                'dok_piagam': 'piagam',
                'dok_prestasi': 'prestasi',
                'dok_skpindah': 'sk_pindah',
                'dok_skdomisili': 'sk_domisili',
                'dok_pkh': 'pkh',
                'dok_kks': 'kks',
                'dok_kip': 'kip',
                'dok_kis': 'kis',
                'dok_foto': 'foto'
            }[field] || 'lainnya';

            if (pendaftaran[field] && fs.existsSync(`./content/uploads/pendaftaran/${subfolder}/${pendaftaran[field]}`)) {
                fs.unlinkSync(`./content/uploads/pendaftaran/${subfolder}/${pendaftaran[field]}`);
            }
        });

        // Simpan id_user untuk dihapus nanti
        const userId = pendaftaran.id_user;

        // Hapus pendaftaran terlebih dahulu
        await pendaftaran.destroy();

        // Setelah pendaftaran dihapus, baru hapus user
        await User.destroy({
            where: { id_user: userId }
        });

        res.json({
            success: true,
            message: "Pendaftaran berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal menghapus pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mengambil data pendaftaran yang diterima berdasarkan sekolah tujuan
 * @param {Request} req - Express request object dengan parameter id_sekolah_tujuan
 * @param {Response} res - Express response object
 */
export const getPendaftaranDiterimaBySekolah = async (req, res) => {
    try {
        // Validasi parameter id_sekolah_tujuan
        const idSekolahTujuan = req.params.id_sekolah_tujuan;
        if (!idSekolahTujuan) {
            return res.status(400).json({
                status: false,
                message: "ID Sekolah Tujuan harus diisi"
            });
        }

        // Mengambil data pendaftaran yang diterima
        const pendaftaranDiterima = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: idSekolahTujuan,
                is_diterima: 1 // hanya yang diterima
            },
            include: [
                {
                    model: JenisKelamin,
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama', 'npsn']
                },
                {
                    model: JalurPendaftaran,
                    attributes: ['id_jalur_pendaftaran', 'nama']
                }
            ],
            order: [['waktu_daftar', 'DESC']] // Urutkan berdasarkan waktu pendaftaran terbaru
        });

        // Format response data
        const formattedData = formatPendaftaranResponse(pendaftaranDiterima);

        return res.status(200).json({
            status: true,
            message: "Data pendaftaran yang diterima berhasil diambil",
            data: formattedData
        });

    } catch (error) {
        console.error('Error in getPendaftaranDiterimaBySekolah:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan saat mengambil data pendaftaran",
            error: error.message
        });
    }
}

/**
 * Mengambil data pendaftaran yang belum diterima berdasarkan sekolah tujuan
 * @param {Request} req - Express request object dengan parameter id_sekolah_tujuan
 * @param {Response} res - Express response object
 */
export const getPendaftaranBelumDiterimaBySekolahZonasi = async (req, res) => {
    const idSekolahTujuan = req.params.id_sekolah_tujuan;

    // Validasi parameter id sekolah tujuan
    if (!idSekolahTujuan) {
        return res.status(400).json({
            status: 'error',
            message: 'Parameter id_sekolah_tujuan diperlukan'
        });
    }

    Pendaftaran.findAll({
        where: {
            id_sekolah_tujuan: idSekolahTujuan,
            id_jalur_pendaftaran: 1, // Filter untuk jalur zonasi
            is_diterima: {
                [Op.or]: [null || 0] // Mengambil yang belum diterima (null)
            }
        },
        include: [
            {
                model: User,
            },
            {
                model: Sekolah,
                as: 'sekolah_asal_data',
                attributes: ['nama']
            },
            {
                model: Sekolah,
                as: 'sekolah_tujuan_data',
                attributes: ['nama']
            },
            {
                model: JalurPendaftaran,
                as: 'jalur_pendaftaran',
                attributes: ['nama']
            },
            {
                model: JenisKelamin,
                attributes: ['nama']
            }
        ],
        order: [['waktu_daftar', 'ASC']]
    })
        .then(pendaftaran => {
            const formattedPendaftaran = formatPendaftaranResponse(pendaftaran);
            res.json({
                status: 'success',
                message: 'Data pendaftaran jalur zonasi yang belum diterima berhasil diambil',
                data: formattedPendaftaran
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'error',
                message: 'Gagal mengambil data pendaftaran: ' + err.message
            });
        });
}

/**
 * Menghasilkan data pendaftaran dalam format yang mudah dikopi
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const copyToClipboard = async (req, res) => {
    try {
        // Mengambil semua data pendaftaran dengan relasi yang diperlukan
        const pendaftaranData = await Pendaftaran.findAll({
            include: [
                { model: User, attributes: ['fullname'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama', 'npsn'] }
            ],
            order: [['waktu_daftar', 'ASC']]
        });

        // Log untuk debugging
        console.log('Jumlah data pendaftaran:', pendaftaranData.length);
        if (pendaftaranData.length > 0) {
            console.log('Contoh data pertama:', JSON.stringify(pendaftaranData[0], null, 2));
        }

        // Header kolom
        const headers = [
            'No',
            'No Pendaftaran',
            'Nama Lengkap',
            'Jenis Kelamin',
            'NISN',
            'NIK',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Nama Ayah',
            'Nama Ibu',
            // 'Nama Orang Tua', // backup
            'Provinsi',
            'Kabupaten/Kota',
            'Kecamatan',
            'Kelurahan/Desa',
            'Alamat Detail',
            'Sekolah Asal',
            'Sekolah Tujuan',
            'NPSN Sekolah Tujuan',
            'Jalur Pendaftaran',
            'Status',
            'Waktu Daftar'
        ].join(',') + '\n';

        // Mengatur lebar maksimum untuk setiap kolom
        const columnWidths = headers.map((header, index) => {
            const maxWidth = Math.max(
                header.length,
                ...pendaftaranData.map(data => {
                    const value = [
                        (index + 1).toString(),
                        data.no_pendaftaran,
                        data.User?.fullname || '-',
                        data.JenisKelamin?.nama || '-',
                        data.nisn || '-',
                        data.nik || '-',
                        data.tempat_lahir || '-',
                        moment(data.tanggal_lahir).format('DD/MM/YYYY') || '-',
                        data.nama_ayah || '-',
                        data.nama_ibu || '-',
                        // data.nama_orang_tua, // backup
                        data.Provinsi?.nama_provinsi || '-',
                        data.KabupatenKota?.nama_kabupaten_kota || '-',
                        data.Kecamatan?.nama_kecamatan || '-',
                        data.Kelurahan?.nama_kelurahan || '-',
                        data.alamat_detail || '-',
                        data.sekolah_asal_data?.nama || '-',
                        data.sekolah_tujuan_data?.nama || '-',
                        data.sekolah_tujuan_data?.npsn || '-',
                        data.JalurPendaftaran?.nama || '-',
                        data.status_pendaftaran || '-',
                        moment(data.waktu_daftar).format('DD/MM/YYYY HH:mm:ss') || '-'
                    ][index];
                    return value ? value.toString().length : 0;
                })
            );
            return maxWidth + 2; // Tambah padding
        });

        // Fungsi untuk membuat garis horizontal
        const createHorizontalLine = () => {
            return '+' + columnWidths.map(width => '-'.repeat(width)).join('+') + '+';
        };

        // Fungsi untuk memformat baris data
        const formatRow = (items) => {
            return '|' + items.map((item, index) => {
                const paddedItem = item.toString().padEnd(columnWidths[index]);
                return paddedItem;
            }).join('|') + '|';
        };

        // Membuat tabel
        let tableRows = [];

        // Tambah garis atas
        tableRows.push(createHorizontalLine());

        // Tambah header
        tableRows.push(formatRow(headers));

        // Tambah garis pemisah header
        tableRows.push(createHorizontalLine());

        // Tambah data
        pendaftaranData.forEach((data, index) => {
            const row = [
                (index + 1).toString(),
                data.no_pendaftaran,
                data.User?.fullname || '-',
                data.JenisKelamin?.nama || '-',
                data.nisn || '-',
                data.nik || '-',
                data.tempat_lahir || '-',
                moment(data.tanggal_lahir).format('DD/MM/YYYY') || '-',
                data.nama_ayah || '-',
                data.nama_ibu || '-',
                // data.nama_orang_tua, || '-',// backup
                data.Provinsi?.nama_provinsi || '-',
                data.KabupatenKota?.nama_kabupaten_kota || '-',
                data.Kecamatan?.nama_kecamatan || '-',
                data.Kelurahan?.nama_kelurahan || '-',
                data.alamat_detail || '-',
                data.sekolah_asal_data?.nama || '-',
                data.sekolah_tujuan_data?.nama || '-',
                data.sekolah_tujuan_data?.npsn || '-',
                data.JalurPendaftaran?.nama || '-',
                data.status_pendaftaran || '-',
                moment(data.waktu_daftar).format('DD/MM/YYYY HH:mm:ss') || '-'
            ];
            tableRows.push(formatRow(row));

            // Tambah garis pemisah setiap 5 baris untuk memudahkan pembacaan
            if ((index + 1) % 5 === 0 && index < pendaftaranData.length - 1) {
                tableRows.push(createHorizontalLine());
            }
        });

        // Tambah garis bawah
        tableRows.push(createHorizontalLine());

        // Gabungkan semua baris
        const finalOutput = tableRows.join('\n');

        // Mengirim response
        res.status(200).json({
            status: 'success',
            message: 'Data berhasil diformat untuk dikopi',
            data: finalOutput
        });

    } catch (error) {
        console.error('Error dalam copyToClipboard:', error);
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat memformat data',
            error: error.message
        });
    }
};

/**
 * Mengambil data pendaftaran berdasarkan jalur dan menghitung jumlahnya
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getPendaftaranByJalur = async (req, res) => {
    try {
        // Mengambil data pendaftaran dan mengelompokkan berdasarkan sekolah dan jalur
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                is_diterima: 1
            },
            include: [{
                model: JalurPendaftaran,
                attributes: ['nama']
            }, {
                model: Sekolah,
                as: 'sekolah_tujuan_data',
                attributes: ['nama', 'npsn', 'id_kecamatan'],
                include: [{
                    model: Kecamatan,
                    attributes: ['nama_kecamatan']
                }]
            }],
            attributes: [
                [Sequelize.col('pendaftaran.id_sekolah_tujuan'), 'id_sekolah_tujuan'],
                [Sequelize.col('pendaftaran.id_jalur_pendaftaran'), 'id_jalur_pendaftaran'],
                [Sequelize.fn('COUNT', Sequelize.col('pendaftaran.id_pendaftaran')), 'jumlah']
            ],
            group: ['pendaftaran.id_sekolah_tujuan', 'pendaftaran.id_jalur_pendaftaran', 'jalur_pendaftaran.id_jalur_pendaftaran', 'jalur_pendaftaran.nama', 'sekolah_tujuan_data.id_sekolah', 'sekolah_tujuan_data.nama', 'sekolah_tujuan_data.npsn', 'sekolah_tujuan_data.id_kecamatan', 'sekolah_tujuan_data.kecamatan.id_kecamatan', 'sekolah_tujuan_data.kecamatan.nama_kecamatan']
        });

        // Format hasil sesuai kebutuhan
        const hasilPerSekolah = {};

        pendaftaran.forEach(item => {
            const sekolahId = item.dataValues.id_sekolah_tujuan;
            const namaSekolah = item.sekolah_tujuan_data.nama;
            const npsn = item.sekolah_tujuan_data.npsn;
            const kecamatan = item.sekolah_tujuan_data.kecamatan?.nama_kecamatan || '-';
            const jalur = item.jalur_pendaftaran.nama.toLowerCase();
            const jumlah = parseInt(item.dataValues.jumlah);

            if (!hasilPerSekolah[sekolahId]) {
                hasilPerSekolah[sekolahId] = {
                    npsn: npsn,
                    nama_sekolah: namaSekolah,
                    kecamatan: kecamatan,
                    jumlah_per_jalur: {
                        zonasi: 0,
                        prestasi: 0,
                        afirmasi: 0,
                        pindahan: 0,
                        reguler: 0,
                        total: 0
                    }
                };
            }

            hasilPerSekolah[sekolahId].jumlah_per_jalur[jalur] = jumlah;

            // Menghitung total dari semua jalur
            hasilPerSekolah[sekolahId].jumlah_per_jalur.total =
                hasilPerSekolah[sekolahId].jumlah_per_jalur.zonasi +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.prestasi +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.afirmasi +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.pindahan +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.reguler;
        });

        return res.status(200).json({
            status: true,
            message: "Data pendaftaran berdasarkan jalur berhasil diambil",
            data: Object.values(hasilPerSekolah)
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mengambil data pendaftaran berdasarkan sekolah tujuan yang diterima
 * @param {Request} req - Express request object dengan parameter id_sekolah_tujuan
 * @param {Response} res - Express response object
 */
export const getPendaftaranBySekolahTujuan = async (req, res) => {
    try {
        const { id } = req.params;

        // Mengambil data pendaftaran berdasarkan sekolah tujuan
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: id,
                is_diterima: 1
            },
            attributes: [
                'no_pendaftaran',
                'nama_siswa',
                'alamat'
            ],
            include: [{
                model: Sekolah,
                as: 'sekolah_asal_data',
                attributes: ['nama']
            }, {
                model: Sekolah,
                as: 'sekolah_tujuan_data',
                attributes: ['nama']
            }],
            order: [['no_pendaftaran', 'ASC']]
        });

        // Format response data
        const formattedData = pendaftaran.map(item => ({
            no_pendaftaran: item.no_pendaftaran,
            nama_siswa: item.nama_siswa,
            alamat: item.alamat,
            sekolah_asal: `${item.sekolah_asal_data.nama} ${item.sekolah_asal_data.kecamatan ? 'KEC. ' + item.sekolah_asal_data.kecamatan.nama_kecamatan : ''}`
        }));

        return res.status(200).json({
            status: true,
            message: "Data pendaftaran berdasarkan sekolah tujuan berhasil diambil",
            data: formattedData
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftaran",
            error: error.message
        });
    }
};

/**
 * Mengambil detail pendaftar yang diterima berdasarkan sekolah dan asal kabupaten
 * @param {Request} req - Express request object dengan parameter id_sekolah_tujuan dan id_jalur_pendaftaran
 * @param {Response} res - Express response object
 */
export const getDetailPendaftaranByJalur = async (req, res) => {
    try {
        const { id_sekolah_tujuan, id_jalur_pendaftaran } = req.params;

        // Validasi parameter
        if (!id_sekolah_tujuan) {
            return res.status(400).json({
                status: false,
                message: "ID sekolah tujuan harus diisi"
            });
        }

        // Menyiapkan kondisi where
        const whereCondition = {
            id_sekolah_tujuan: id_sekolah_tujuan,
            is_diterima: 1
        };

        // Jika id_jalur_pendaftaran bukan 'semua', tambahkan ke kondisi where
        if (id_jalur_pendaftaran && id_jalur_pendaftaran !== 'semua') {
            whereCondition.id_jalur_pendaftaran = parseInt(id_jalur_pendaftaran);
        }

        // Mengambil data pendaftar
        const pendaftar = await Pendaftaran.findAll({
            where: whereCondition,
            include: [
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: JalurPendaftaran,
                    attributes: ['nama']
                }
            ],
            attributes: [
                'no_pendaftaran',
                'nama_siswa',
                'waktu_diterima',
                'alamat'
            ],
            order: [['waktu_diterima', 'ASC']]
        });

        // Format hasil untuk ditampilkan
        const hasilPendaftar = pendaftar.map((item, index) => ({
            no: index + 1,
            no_pendaftaran: item.no_pendaftaran,
            nama_siswa: item.nama_siswa,
            alamat: item.alamat,
            sekolah_asal: `${item.sekolah_asal_data.nama} ${item.sekolah_asal_data.kecamatan ? 'KEC. ' + item.sekolah_asal_data.kecamatan.nama_kecamatan : ''}`
        }));

        return res.status(200).json({
            status: true,
            message: "Data detail pendaftar berhasil diambil",
            data: hasilPendaftar
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data detail pendaftar",
            error: error.message
        });
    }
};

/**
 * Fungsi untuk mendapatkan data siswa yang belum tertampung berdasarkan sekolah
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getBelumTertampung = async (req, res) => {
    try {
        const { jenis_sekolah } = req.params;

        // Menyiapkan kondisi where untuk filter sekolah
        const whereCondition = {};

        // Jika jenis_sekolah ada dan bukan 'semua', tambahkan ke kondisi where
        if (jenis_sekolah && jenis_sekolah !== 'semua') {
            whereCondition.id_tipe_sekolah = parseInt(jenis_sekolah); // Konversi ke integer
        }

        // Query untuk mendapatkan data
        const result = await Sekolah.findAll({
            where: whereCondition,
            include: [{
                model: TipeSekolah,
                attributes: ['nama']
            }],
            attributes: [
                'npsn',
                'nama',
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota = sekolah.id_kabupaten_kota
                    )`),
                    'mendaftar_dalam'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota = sekolah.id_kabupaten_kota 
                        AND p.is_diterima = 1
                    )`),
                    'diterima_dalam'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota = sekolah.id_kabupaten_kota
                    ) - (
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota = sekolah.id_kabupaten_kota 
                        AND p.is_diterima = 1
                    )`),
                    'sisa_dalam'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota != sekolah.id_kabupaten_kota
                    )`),
                    'mendaftar_luar'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota != sekolah.id_kabupaten_kota 
                        AND p.is_diterima = 1
                    )`),
                    'diterima_luar'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota != sekolah.id_kabupaten_kota
                    ) - (
                        SELECT COUNT(DISTINCT p.id_pendaftaran) 
                        FROM pendaftaran p 
                        WHERE p.id_sekolah_tujuan = sekolah.id_sekolah 
                        AND p.id_kabupaten_kota != sekolah.id_kabupaten_kota 
                        AND p.is_diterima = 1
                    )`),
                    'sisa_luar'
                ]
            ],
            order: [['nama', 'ASC']]
        });

        // Kirim response
        res.json({
            status: true,
            message: "Data siswa belum tertampung berhasil didapatkan",
            data: result
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

/**
 * Fungsi untuk mengelola data siswa yang belum tertampung
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getKelolaBelumTertampung = async (req, res) => {
    try {
        // Ambil parameter dari params URL
        const { tingkatan, jalur_pendaftaran, domisili } = req.params;

        // Buat kondisi where untuk filter
        let whereClause = {
            is_diterima: 0 // Status belum diterima
        };

        // Tambahkan filter tingkatan jika ada dan bukan 'Semua Tingkatan'
        if (tingkatan && tingkatan !== 'semuaTingkatan') {
            whereClause.id_tipe_sekolah_asal = tingkatan;
        }

        // Tambahkan filter jalur pendaftaran jika ada
        if (jalur_pendaftaran && jalur_pendaftaran !== 'semuaJalurPendaftaran') {
            whereClause.id_jalur_pendaftaran = jalur_pendaftaran;
        }

        // Tambahkan filter domisili jika ada
        if (domisili && domisili !== 'semuaDomisili') {
            if (domisili === '3505') {
                whereClause.id_kabupaten_kota = '3505'; // Dalam Kabupaten Blitar
            } else {
                whereClause.id_kabupaten_kota = {
                    [Op.ne]: '3505' // Selain Kabupaten Blitar
                };
            }
        }
        // Ambil data pendaftaran dengan join ke tabel terkait
        const result = await Pendaftaran.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: JalurPendaftaran,
                    attributes: ['id_jalur_pendaftaran', 'nama']
                }
            ],
            // attributes: [
            //     'id_pendaftaran',    
            //     'nik',
            //     'nomor_telepon',
            //     'nama_siswa',
            //     'alamat',
            //     'id_sekolah_asal',
            //     'id_jalur_pendaftaran',
            //     'is_diterima'
            // ],
            order: [
                ['waktu_daftar', 'ASC']
            ]
        });

        // Format response data untuk tampilan tabel
        const formattedResult = result.map(item => ({
            id_pendaftaran: item.id_pendaftaran,
            nik: item.nik,
            telepon: item.nomor_telepon,
            nama_siswa: item.nama_siswa,
            alamat: item.alamat,
            asal_sekolah: item.sekolah_asal_data?.nama || '-',
            jalur_pendaftaran: item.jalur_pendaftaran?.nama || '-',
            status: item.is_diterima === 0 ? 'Belum Tertampung' : 'Tertampung'
        }));

        res.json({
            status: true,
            message: "Data kelola siswa belum tertampung berhasil didapatkan",
            data: formattedResult
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

/**
 * Fungsi untuk mengupdate data kelola belum tertampung
 * @param {Request} req - Express request object dengan parameter id_pendaftaran
 * @param {Response} res - Express response object
 */
export const updateKelolaBelumTertampung = async (req, res) => {
    try {
        const { id_pendaftaran } = req.params;
        const { id_sekolah_tujuan, jarak_sekolah_tujuan } = req.body;

        // Validasi input
        if (!id_pendaftaran || !id_sekolah_tujuan || !jarak_sekolah_tujuan) {
            return res.status(400).json({
                status: false,
                message: "Semua field harus diisi"
            });
        }

        // Cek apakah data pendaftaran ada
        const pendaftaran = await Pendaftaran.findOne({
            where: {
                id_pendaftaran: id_pendaftaran,
                is_diterima: 0
            }
        });

        if (!pendaftaran) {
            return res.status(404).json({
                status: false,
                message: "Data pendaftaran tidak ditemukan atau sudah diterima"
            });
        }

        // Cek apakah sekolah tujuan valid
        const sekolah = await Sekolah.findByPk(id_sekolah_tujuan);
        if (!sekolah) {
            return res.status(404).json({
                status: false,
                message: "Sekolah tujuan tidak ditemukan"
            });
        }

        // Dapatkan data pendaftaran untuk mendapatkan jalur
        const dataPendaftaran = await Pendaftaran.findByPk(id_pendaftaran);
        if (!dataPendaftaran) {
            return res.status(404).json({
                status: false,
                message: "Data pendaftaran tidak ditemukan"
            });
        }

        // Cek ketersediaan pagu dengan fungsi cekPaguSekolah
        const isPaguTersedia = await cekPaguSekolah(id_sekolah_tujuan, dataPendaftaran.id_jalur_pendaftaran);
        if (!isPaguTersedia) {
            return res.status(400).json({
                status: false,
                message: "Pagu sekolah tujuan untuk jalur ini sudah penuh"
            });
        }

        const parsedJarak = parseFloat(jarak_sekolah_tujuan).toFixed(2);

        // Update data
        await pendaftaran.update({
            id_sekolah_tujuan,
            jarak_sekolah_tujuan: parsedJarak
        });

        res.json({
            status: true,
            message: "Data berhasil diupdate",
            data: pendaftaran
        });

    } catch (error) {
        console.error('Error in updateKelolaBelumTertampung:', error);
        res.status(500).json({
            status: false,
            message: "Terjadi kesalahan saat mengupdate data",
            error: error.message
        });
    }
    
};
/**
 * Mengambil data pendaftaran berdasarkan sekolah tujuan dan jalur zonasi
 * @param {Request} req - Express request object dengan parameter id_sekolah_tujuan
 * @param {Response} res - Express response object
 */
export const getPendaftaranBySekolahZonasi = async (req, res) => {
    try {
        const { id_sekolah_tujuan } = req.params;

        // Validasi parameter
        if (!id_sekolah_tujuan || isNaN(parseInt(id_sekolah_tujuan))) {
            return res.status(400).json({
                success: false,
                message: "ID sekolah tujuan tidak valid"
            });
        }

        // Ambil data pendaftaran dengan include relasi yang diperlukan
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jalur_pendaftaran: 1 // 1 untuk jalur zonasi
            },
            include: [
                {
                    model: JenisKelamin,
                    as: 'jenis_kelamin',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama']
                }
            ],
            order: [
                ['waktu_daftar', 'ASC'] // Urutkan berdasarkan waktu pendaftaran terbaru
            ]
        });

        // Format response data
        const formattedData = pendaftaran.map(item => ({
            ...item.get({ plain: true }),
            waktu_daftar: formatDate(item.waktu_daftar),
            waktu_diterima: item.waktu_diterima ? formatDate(item.waktu_diterima) : null
        }));

        res.status(200).json({
            success: true,
            message: "Data pendaftaran jalur zonasi berhasil diambil",
            total: formattedData.length,
            data: formattedData
        });

    } catch (error) {
        console.error('Error saat mengambil data pendaftaran zonasi:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data pendaftaran",
            error: error.message
        });
    }
};
/**
 * Mengambil data pendaftaran berdasarkan user ID
 * @param {Request} req - Express request object dengan parameter userId
 * @param {Response} res - Express response object
 */
export const getPendaftaranByUserId = async (req, res) => {
    try {
        const pendaftaran = await Pendaftaran.findOne({
            where: {
                id_user: req.params.userId
            },
            include: [
                { model: User, attributes: ['id_user', 'username', 'fullname', 'email', 'phone', 'address', 'status'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ]
        });

        if (!pendaftaran) {
            return res.status(404).json({
                success: false,
                message: "Data pendaftaran tidak ditemukan"
            });
        }

        res.json({
            success: true,
            message: "Data pendaftaran berhasil diambil",
            data: formatPendaftaranResponse(pendaftaran)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update data pendaftaran berdasarkan user ID
 * @param {Request} req - Express request object dengan parameter userId
 * @param {Response} res - Express response object
 */
export const updatePendaftaranByUserId = async (req, res) => {
    try {
        const pendaftaran = await Pendaftaran.findOne({
            where: { id_user: req.params.userId }
        });

        if (!pendaftaran) {
            return res.status(404).json({
                success: false,
                message: "Data pendaftaran tidak ditemukan"
            });
        }

        const { nisn, nomor_telepon, latitude, longitude, nilai_bhs_indonesia, nilai_ipa, nilai_matematika } = req.body;
        
        // Update pendaftaran
        await pendaftaran.update({
            nisn,
            nomor_telepon,
            latitude,
            longitude,
            nilai_bhs_indonesia,
            nilai_ipa,
            nilai_matematika
        });

        // Update user phone if provided
        if (nomor_telepon) {
            await User.update(
                { phone: nomor_telepon },
                { where: { id_user: req.params.userId } }
            );
        }

        // Get updated data with all relations
        const updatedPendaftaran = await Pendaftaran.findOne({
            where: { id_user: req.params.userId },
            include: [
                { model: User, attributes: ['id_user', 'username', 'fullname', 'email', 'phone', 'address', 'status'] },
                { model: JenisKelamin, attributes: ['nama'] },
                { model: Provinsi, attributes: ['nama_provinsi'] },
                { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                { model: Kecamatan, attributes: ['nama_kecamatan'] },
                { model: Kelurahan, attributes: ['nama_kelurahan'] },
                { model: JalurPendaftaran, attributes: ['nama'] },
                { model: TipeSekolah, attributes: ['slug'] },
                { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
            ]
        });

        res.json({
            success: true,
            message: "Data berhasil diperbarui",
            data: formatPendaftaranResponse(updatedPendaftaran)
        });
    } catch (error) {
        console.error('Error updating pendaftaran:', error);
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui data: " + error.message
        });
    }
};

// Get total pendaftar dan total per tipe sekolah
export const getTotalPendaftar = async (req, res) => {
    try {
        // Definisi kategori sekolah
        const schoolCategories = {
            TK: { label: 'TK', ids: [112] },
            RA: { label: 'RA', ids: [122] },
            SD: { label: 'SD', ids: [211, 212] },
            MI: { label: 'MI', ids: [221, 222] },
            SLTP: { label: 'SMP', ids: [311, 312] }, // Menggunakan label SMP untuk SLTP
            MTS: { label: 'MTS', ids: [321, 322] }
        };
        
        // Hitung total seluruh pendaftar
        const totalPendaftar = await Pendaftaran.count();
        
        // Hitung total per kategori sekolah
        const totals = await Promise.all(
            Object.entries(schoolCategories).map(async ([key, category]) => {
                const total = await Pendaftaran.count({
                    include: [{
                        model: Sekolah,
                        as: 'sekolah_tujuan_data', // Menggunakan alias yang benar
                        where: {
                            id_tipe_sekolah: {
                                [Op.in]: category.ids
                            }
                        }
                    }]
                });
                return {
                    label: category.label,
                    value: total.toString()
                };
            })
        );

        // Format response
        const formattedResponse = {
            total: totalPendaftar,
            perTipe: totals
        };

        res.status(200).json({
            status: true,
            message: "Data total pendaftar berhasil didapatkan",
            data: formattedResponse
        });

    } catch (error) {
        console.error('Error in getTotalPendaftar:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// Get total pendaftar yang diterima dan total per tipe sekolah
export const getTotalDiterima = async (req, res) => {
    try {
        // Definisi kategori sekolah
        const schoolCategories = {
            TK: { label: 'TK', ids: [112] },
            RA: { label: 'RA', ids: [122] },
            SD: { label: 'SD', ids: [211, 212] },
            MI: { label: 'MI', ids: [221, 222] },
            SLTP: { label: 'SMP', ids: [311, 312] },
            MTS: { label: 'MTS', ids: [321, 322] }
        };
        
        // Hitung total seluruh pendaftar yang diterima
        const totalDiterima = await Pendaftaran.count({
            where: {
                is_diterima: 1
            }
        });
        
        // Hitung total per kategori sekolah
        const totals = await Promise.all(
            Object.entries(schoolCategories).map(async ([key, category]) => {
                const total = await Pendaftaran.count({
                    where: {
                        is_diterima: 1
                    },
                    include: [{
                        model: Sekolah,
                        as: 'sekolah_tujuan_data',
                        where: {
                            id_tipe_sekolah: {
                                [Op.in]: category.ids
                            }
                        }
                    }]
                });
                console.log(`Total diterima untuk ${category.label}:`, total);
                return {
                    label: category.label,
                    value: total.toString()
                };
            })
        );

        const formattedResponse = {
            total: totalDiterima,
            perTipe: totals
        };

        console.log('Response data diterima:', formattedResponse);

        res.status(200).json({
            status: true,
            message: "Data total pendaftar yang diterima berhasil didapatkan",
            data: formattedResponse
        });

    } catch (error) {
        console.error('Error in getTotalDiterima:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};
/**
 * Fungsi untuk mendapatkan data pendaftar berdasarkan sekolah tujuan khusus jalur prestasi
 * @param {object} req - Request dari client berisi id_sekolah_tujuan
 * @param {object} res - Response yang akan dikirim ke client
 */
export const getPendaftaranBySekolahPrestasi = async (req, res) => {
    try {
        // Ambil id sekolah dari parameter URL
        const { id_sekolah_tujuan } = req.params;

        // Cari semua pendaftar dengan jalur prestasi (id = 2)
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jalur_pendaftaran: 2 // 2 untuk jalur prestasi
            },
            // Include relasi yang dibutuhkan
            include: [
                {
                    model: JenisKelamin,
                    as: 'jenis_kelamin',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama']
                }
            ],
            order: [
                ['waktu_daftar', 'ASC'] // Urutkan berdasarkan waktu pendaftaran terbaru
            ]
        });

        // Format response data
        const formattedData = pendaftaran.map(item => ({
            ...item.get({ plain: true }),
            waktu_daftar: formatDate(item.waktu_daftar),
            waktu_diterima: item.waktu_diterima ? formatDate(item.waktu_diterima) : null
        }));

        res.status(200).json({
            success: true,
            message: "Data pendaftaran jalur zonasi berhasil diambil",
            total: formattedData.length,
            data: formattedData
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftar",
            error: error.message
        });
    }
};
/**
 * Upload dokumen pendaftaran baru
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const uploadDokumenBaru = async (req, res) => {
    const upload = uploadDokumenFields.fields([
        { name: 'aktaKelahiran', maxCount: 1 },
        { name: 'kartuKeluarga', maxCount: 1 },
        { name: 'kartuIdentitasAnak', maxCount: 1 },
        { name: 'skhun', maxCount: 1 },
        { name: 'suratKeteranganDomisili', maxCount: 1 },
        { name: 'fotoDiri', maxCount: 1 }
    ]);

    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Error uploading file: ${err.message}`
            });
        } else if (err) {
            return res.status(500).json({
                success: false,
                message: `Unexpected error: ${err.message}`
            });
        }

        try {
            const { id_pendaftaran } = req.params;
            
            const pendaftaran = await Pendaftaran.findByPk(id_pendaftaran);
            if (!pendaftaran) {
                return res.status(404).json({
                    success: false,
                    message: "Data pendaftaran tidak ditemukan"
                });
            }

            const updateData = {};

            // Process each document type
            if (req.files.aktaKelahiran) {
                updateData.dok_akta = req.files.aktaKelahiran[0].filename;
            }
            if (req.files.kartuKeluarga) {
                updateData.dok_kk = req.files.kartuKeluarga[0].filename;
            }
            if (req.files.kartuIdentitasAnak) {
                updateData.dok_kia = req.files.kartuIdentitasAnak[0].filename;
            }
            if (req.files.skhun) {
                updateData.dok_skhun = req.files.skhun[0].filename;
            }
            if (req.files.suratKeteranganDomisili) {
                updateData.dok_skdomisili = req.files.suratKeteranganDomisili[0].filename;
            }
            if (req.files.fotoDiri) {
                updateData.dok_foto = req.files.fotoDiri[0].filename;
            }

            await pendaftaran.update(updateData);

            res.status(200).json({
                success: true,
                message: "Dokumen berhasil diupload",
                data: updateData
            });
        } catch (error) {
            console.error('Error in uploadDokumenBaru:', error);
            res.status(500).json({
                success: false,
                message: "Gagal mengupload dokumen",
                error: error.message
            });
        }
    });
};
/**
 * Fungsi untuk mendapatkan data pendaftar berdasarkan sekolah tujuan khusus jalur mandiri
 * @param {object} req - Request dari client berisi id_sekolah_tujuan
 * @param {object} res - Response yang akan dikirim ke client
 */
export const getPendaftaranBySekolahMandiri = async (req, res) => {
    try {
        // Ambil id sekolah dari parameter URL
        const { id_sekolah_tujuan } = req.params;

        // Cari semua pendaftar dengan jalur mandiri (id = 5)
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jalur_pendaftaran: 5 // 5 untuk jalur mandiri
            },
            // Include relasi yang dibutuhkan
            include: [
                {
                    model: JenisKelamin,
                    as: 'jenis_kelamin',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama']
                }
            ],
            order: [
                ['waktu_daftar', 'ASC'] // Urutkan berdasarkan waktu pendaftaran terbaru
            ]
        });

        // Format response data
        const formattedData = pendaftaran.map(item => ({
            ...item.get({ plain: true }),
            waktu_daftar: formatDate(item.waktu_daftar),
            waktu_diterima: item.waktu_diterima ? formatDate(item.waktu_diterima) : null
        }));

        res.status(200).json({
            success: true,
            message: "Data pendaftaran jalur zonasi berhasil diambil",
            total: formattedData.length,
            data: formattedData
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftar",
            error: error.message
        });
    }
};
/**
 * Fungsi untuk mendapatkan data pendaftar berdasarkan sekolah tujuan khusus jalur pindahan
 * @param {object} req - Request dari client berisi id_sekolah_tujuan
 * @param {object} res - Response yang akan dikirim ke client
 */
export const getPendaftaranBySekolahPindahan = async (req, res) => {
    try {
        // Ambil id sekolah dari parameter URL
        const { id_sekolah_tujuan } = req.params;

        // Cari semua pendaftar dengan jalur pindahan (id = 3)
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jalur_pendaftaran: 3 // 3 untuk jalur pindahan
            },
            // Include relasi yang dibutuhkan
            include: [
                {
                    model: JenisKelamin,
                    as: 'jenis_kelamin',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama']
                }
            ],
            order: [
                ['waktu_daftar', 'ASC'] // Urutkan berdasarkan waktu pendaftaran terbaru
            ]
        });

        // Format response data
        const formattedData = pendaftaran.map(item => ({
            ...item.get({ plain: true }),
            waktu_daftar: formatDate(item.waktu_daftar),
            waktu_diterima: item.waktu_diterima ? formatDate(item.waktu_diterima) : null
        }));

        res.status(200).json({
            success: true,
            message: "Data pendaftaran jalur zonasi berhasil diambil",
            total: formattedData.length,
            data: formattedData
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftar",
            error: error.message
        });
    }
};
/**
 * Fungsi untuk mendapatkan data pendaftar berdasarkan sekolah tujuan khusus jalur afirmasi
 * @param {object} req - Request dari client berisi id_sekolah_tujuan
 * @param {object} res - Response yang akan dikirim ke client
 */
export const getPendaftaranBySekolahAfirmasi = async (req, res) => {
    try {
        // Ambil id sekolah dari parameter URL
        const { id_sekolah_tujuan } = req.params;

        // Cari semua pendaftar dengan jalur afirmasi (id = 4)
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jalur_pendaftaran: 4 // 4 untuk jalur afirmasi
            },
            // Include relasi yang dibutuhkan
            include: [
                {
                    model: JenisKelamin,
                    as: 'jenis_kelamin',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama']
                }
            ],
            order: [
                ['waktu_daftar', 'ASC'] // Urutkan berdasarkan waktu pendaftaran terbaru
            ]
        });

        // Format response data
        const formattedData = pendaftaran.map(item => ({
            ...item.get({ plain: true }),
            waktu_daftar: formatDate(item.waktu_daftar),
            waktu_diterima: item.waktu_diterima ? formatDate(item.waktu_diterima) : null
        }));

        res.status(200).json({
            success: true,
            message: "Data pendaftaran jalur zonasi berhasil diambil",
            total: formattedData.length,
            data: formattedData
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftar",
            error: error.message
        });
    }
};

/**
 * Mengambil data pendaftaran berdasarkan jalur dan jenjang sekolah
 * @param {Request} req - Express request object dengan parameter jenjang
 * @param {Response} res - Express response object
 */
export const getPendaftaranByJalurJenjang = async (req, res) => {
    try {
        const { jenjang } = req.params;

        // Tentukan id_tipe_sekolah berdasarkan jenjang
        let tipeSekolahIds = [];
        if (jenjang.toUpperCase() === 'SMP') {
            tipeSekolahIds = [311, 312]; // SMP dan MTS
        } else if (jenjang.toUpperCase() === 'SD') {
            tipeSekolahIds = [211, 212]; // SD dan MI
        } else {
            return res.status(400).json({
                status: false,
                message: "Jenjang tidak valid. Gunakan 'SMP' atau 'SD'"
            });
        }

        // Mengambil data pendaftaran dan mengelompokkan berdasarkan sekolah dan jalur
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                is_diterima: 1,
                '$sekolah_tujuan_data.tipe_sekolah.id_tipe_sekolah$': {
                    [Op.in]: tipeSekolahIds
                }
            },
            include: [{
                model: JalurPendaftaran,
                attributes: ['nama']
            }, {
                model: Sekolah,
                as: 'sekolah_tujuan_data',
                attributes: ['nama', 'npsn', 'id_kecamatan'],
                include: [{
                    model: Kecamatan,
                    attributes: ['nama_kecamatan']
                }, {
                    model: TipeSekolah,
                    attributes: ['id_tipe_sekolah']
                }]
            }],
            attributes: [
                [Sequelize.col('pendaftaran.id_sekolah_tujuan'), 'id_sekolah_tujuan'],
                [Sequelize.col('pendaftaran.id_jalur_pendaftaran'), 'id_jalur_pendaftaran'],
                [Sequelize.fn('COUNT', Sequelize.col('pendaftaran.id_pendaftaran')), 'jumlah']
            ],
            group: ['pendaftaran.id_sekolah_tujuan', 'pendaftaran.id_jalur_pendaftaran', 'jalur_pendaftaran.id_jalur_pendaftaran', 'jalur_pendaftaran.nama', 'sekolah_tujuan_data.id_sekolah', 'sekolah_tujuan_data.nama', 'sekolah_tujuan_data.npsn', 'sekolah_tujuan_data.id_kecamatan', 'sekolah_tujuan_data.kecamatan.id_kecamatan', 'sekolah_tujuan_data.kecamatan.nama_kecamatan', 'sekolah_tujuan_data.tipe_sekolah.id_tipe_sekolah']
        });

        // Format hasil sesuai kebutuhan
        const hasilPerSekolah = {};

        pendaftaran.forEach(item => {
            const sekolahId = item.dataValues.id_sekolah_tujuan;
            const namaSekolah = item.sekolah_tujuan_data.nama;
            const npsn = item.sekolah_tujuan_data.npsn;
            const kecamatan = item.sekolah_tujuan_data.kecamatan?.nama_kecamatan || '-';
            const jalur = item.jalur_pendaftaran.nama.toLowerCase();
            const jumlah = parseInt(item.dataValues.jumlah);

            if (!hasilPerSekolah[sekolahId]) {
                hasilPerSekolah[sekolahId] = {
                    npsn: npsn,
                    nama_sekolah: namaSekolah,
                    kecamatan: kecamatan,
                    jumlah_per_jalur: {
                        zonasi: 0,
                        prestasi: 0,
                        afirmasi: 0,
                        pindahan: 0,
                        reguler: 0,
                        total: 0
                    }
                };
            }

            hasilPerSekolah[sekolahId].jumlah_per_jalur[jalur] = jumlah;

            // Menghitung total dari semua jalur
            hasilPerSekolah[sekolahId].jumlah_per_jalur.total =
                hasilPerSekolah[sekolahId].jumlah_per_jalur.zonasi +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.prestasi +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.afirmasi +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.pindahan +
                hasilPerSekolah[sekolahId].jumlah_per_jalur.reguler;
        });

        return res.status(200).json({
            status: true,
            message: `Data pendaftaran ${jenjang.toUpperCase()} berdasarkan jalur berhasil diambil`,
            data: Object.values(hasilPerSekolah)
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dalam mengambil data pendaftaran",
            error: error.message
        });
    }
};
/**
 * Fungsi untuk mengecek kuota jalur pendaftaran
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const cekKuotaJalur = async (req, res) => {
    try {
        const { id_jalur, id_sekolah } = req.params;
        
        // Validasi parameter
        if (!id_jalur || !id_sekolah) {
            return res.status(400).json({
                status: false,
                message: 'ID jalur pendaftaran dan ID sekolah harus diisi'
            });
        }

        // Konversi ke integer
        const idJalur = parseInt(id_jalur);
        const idSekolah = parseInt(id_sekolah);

        // Ambil data sekolah
        const sekolah = await Sekolah.findByPk(idSekolah);
        if (!sekolah) {
            return res.status(404).json({
                status: false,
                message: 'Sekolah tidak ditemukan'
            });
        }
        
        // Tentukan field kuota berdasarkan jalur
        let kuotaField;
        switch (idJalur) {
            case 1: kuotaField = 'zonasi'; break;
            case 2: kuotaField = 'prestasi'; break;
            case 3: kuotaField = 'pindahan'; break;
            case 4: kuotaField = 'afirmasi'; break;
            case 5: kuotaField = 'reguler'; break;
            default:
                return res.status(400).json({
                    status: false,
                    message: 'Jalur pendaftaran tidak valid'
                });
        }

        // Ambil kuota sekolah untuk jalur tersebut
        const kuota = sekolah[kuotaField] || 0;

        // Hitung jumlah pendaftar
        const totalPendaftar = await Pendaftaran.count({
            where: {
                id_sekolah_tujuan: idSekolah,
                id_jalur_pendaftaran: idJalur
            }
        });

        // Response dengan status kuota
        return res.json({
            status: true,
            data: {
                jalur: idJalur,
                kuota: kuota,
                total_pendaftar: totalPendaftar,
                sisa_kuota: Math.max(0, kuota - totalPendaftar),
                is_penuh: totalPendaftar >= kuota
            }
        });

    } catch (error) {
        console.error('Error saat cek kuota jalur:', error);
        return res.status(500).json({
            status: false,
            message: 'Terjadi kesalahan saat mengecek kuota jalur pendaftaran'
        });
    }
};
/**
 * Mendapatkan statistik pendaftaran berdasarkan sekolah
 * 
 * Menghitung:
 * 1. Total Pendaftar: Jumlah pendaftar dari jalur 2,3,4,5
 * 2. Total Mendaftar: Jumlah pendaftar dari jalur 1
 * 3. Total Diterima: Jumlah pendaftar dari jalur 1 yang sudah diterima
 * 
 * @param {Request} req - Express request object dengan parameter id_sekolah
 * @param {Response} res - Express response object
 */
export const getStatistikPendaftaran = async (req, res) => {
    try {
        const { id_sekolah } = req.params;
        
        if (!id_sekolah) {
            return res.status(400).json({
                status: "error",
                message: "ID Sekolah tidak ditemukan"
            });
        }

        const idSekolah = parseInt(id_sekolah);
        console.log("Mengambil statistik untuk sekolah ID:", idSekolah);

        // Hitung total pendaftar (jalur 2,3,4,5)
        const totalPendaftar = await Pendaftaran.count({
            where: {
                id_sekolah_tujuan: idSekolah,
                id_jalur_pendaftaran: {
                    [Sequelize.Op.in]: [2, 3, 4, 5]
                }
            }
        });

        // Hitung total mendaftar (jalur 1)
        const totalMendaftar = await Pendaftaran.count({
            where: {
                id_sekolah_tujuan: idSekolah,
                id_jalur_pendaftaran: 1
            }
        });

        // Hitung total diterima (jalur 1 dan is_diterima = 1)
        const totalDiterima = await Pendaftaran.count({
            where: {
                id_sekolah_tujuan: idSekolah,
                id_jalur_pendaftaran: 1,
                is_diterima: 1
            }
        });

        console.log("Hasil statistik:", {
            pendaftar: totalPendaftar,
            mendaftar: totalMendaftar,
            diterima: totalDiterima
        });

        return res.status(200).json({
            status: "success",
            data: {
                pendaftar: totalPendaftar,
                mendaftar: totalMendaftar,
                diterima: totalDiterima
            }
        });

    } catch (error) {
        console.error("Error dalam getStatistikPendaftaran:", error);
        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan dalam mengambil statistik pendaftaran",
            error: error.message
        });
    }
};

// untuk membuat pendaftaran dengan nisn

export const createPendaftaranWithoutNIK = async (req, res) => {
    try {
        const { 
            nama_siswa,
            nisn,
            email,
            tempat_lahir, // Tambahkan tempat_lahir di sini
            tanggal_lahir,
            id_jenis_kelamin,
            alamat,
            id_provinsi,
            id_kabupaten_kota,
            id_kecamatan,
            id_kelurahan,
            id_sekolah_asal,
            id_sekolah_tujuan,
            id_jalur_pendaftaran,
            latitude,
            longitude,
            sekolah_asal, // Tambahkan sekolah_asal di sini
            ...pendaftaranData 
        } = req.body;

        // Validasi data wajib
        if (!nama_siswa || !nisn || !tempat_lahir || !tanggal_lahir || !id_jenis_kelamin || 
            !alamat || !id_sekolah_tujuan || !id_jalur_pendaftaran) {
            return res.status(400).json({
                success: false,
                message: "Data wajib (NISN, nama siswa, tempat lahir, tanggal lahir, jenis kelamin, alamat, sekolah tujuan, dan jalur pendaftaran) harus diisi"
            });
        }

        // Cek apakah NISN sudah terdaftar
        const existingPendaftaran = await Pendaftaran.findOne({
            where: { nisn }
        });

        if (existingPendaftaran) {
            return res.status(400).json({
                success: false,
                message: "NISN sudah terdaftar"
            });
        }

        // Cek ketersediaan pagu
        const paguTersedia = await cekPaguSekolah(id_sekolah_tujuan, id_jalur_pendaftaran);
        if (!paguTersedia) {
            return res.status(400).json({
                success: false,
                message: "Mohon maaf, kuota untuk jalur pendaftaran ini sudah penuh"
            });
        }

        // Generate nomor pendaftaran otomatis
        const no_pendaftaran = await generateNoPendaftaran(1, id_sekolah_tujuan);

        // Buat user terlebih dahulu
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(nisn, salt);

        const user = await User.create({
            fullname: nama_siswa,
            email: email || null,
            username: nisn,
            password: hashPassword,
            id_grup_user: 3,
            id_jenis_kelamin: parseInt(id_jenis_kelamin),
            status: 1,
            phone: pendaftaranData.nomor_telepon,
            address: alamat
        });

        try {
            // Buat pendaftaran dengan data lengkap
            const pendaftaran = await Pendaftaran.create({
                no_pendaftaran,
                nisn,
                nama_siswa,
                tempat_lahir, // Tambahkan tempat_lahir di sini
                tanggal_lahir,
                id_user: user.id_user,
                id_sekolah_asal: id_sekolah_asal ? parseInt(id_sekolah_asal) : null,
                id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
                id_jenis_kelamin: parseInt(id_jenis_kelamin),
                id_jalur_pendaftaran: parseInt(id_jalur_pendaftaran),
                id_provinsi: parseInt(id_provinsi),
                id_kabupaten_kota: parseInt(id_kabupaten_kota),
                id_kecamatan: parseInt(id_kecamatan),
                id_kelurahan: parseInt(id_kelurahan),
                alamat,
                sekolah_asal, // Tambahkan sekolah_asal di sini
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                waktu_daftar: moment().format('YYYY-MM-DD HH:mm:ss'),
                is_diterima: 0,
                ...pendaftaranData
            });

            // Ambil data pendaftaran dengan include semua relasi
            const pendaftaranWithUser = await Pendaftaran.findOne({
                where: { id_pendaftaran: pendaftaran.id_pendaftaran },
                include: [
                    { model: User, attributes: ['id_user', 'username', 'fullname', 'email', 'phone', 'address', 'status'] },
                    { model: JenisKelamin, attributes: ['nama'] },
                    { model: Provinsi, attributes: ['nama_provinsi'] },
                    { model: KabupatenKota, attributes: ['nama_kabupaten_kota'] },
                    { model: Kecamatan, attributes: ['nama_kecamatan'] },
                    { model: Kelurahan, attributes: ['nama_kelurahan'] },
                    { model: JalurPendaftaran, attributes: ['nama'] },
                    { model: TipeSekolah, attributes: ['slug'] },
                    { model: Sekolah, as: 'sekolah_asal_data', attributes: ['nama'] },
                    { model: Sekolah, as: 'sekolah_tujuan_data', attributes: ['nama'] }
                ]
            });

            res.status(201).json({
                success: true,
                message: "Pendaftaran berhasil dibuat",
                data: {
                    ...formatPendaftaranResponse(pendaftaranWithUser)
                }
            });
        } catch (pendaftaranError) {
            await user.destroy();
            throw new Error("Gagal membuat pendaftaran: " + pendaftaranError.message);
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: "Validasi gagal",
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        console.error('Error detail:', error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat pendaftaran",
            error: error.message
        });
    }
};
/**
 * Mengupdate data pendaftaran tanpa NIK
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updatePendaftaranWithoutNIK = async (req, res) => {
    try {
        const { id_pendaftaran } = req.params;
        const {
            nama_siswa,
            nisn,
            email,
            tempat_lahir,
            tanggal_lahir,
            id_jenis_kelamin,
            alamat,
            id_provinsi,
            id_kabupaten_kota,
            id_kecamatan,
            id_kelurahan,
            id_sekolah_asal,
            id_sekolah_tujuan,
            id_jalur_pendaftaran,
            latitude,
            longitude,
            nomor_telepon,
            tahun_lulus,
            nama_ayah,
            nama_ibu,
            sekolah_asal, // Tambahkan sekolah_asal di sini
            ...pendaftaranData
        } = req.body;

        // Validasi data wajib
        if (!nama_siswa || !nisn || !tempat_lahir || !tanggal_lahir || 
            !id_jenis_kelamin || !alamat || !nomor_telepon || !tahun_lulus ||
            !id_provinsi || !id_kabupaten_kota || !id_kecamatan || !id_kelurahan ||
            !id_sekolah_tujuan || !id_jalur_pendaftaran) {
            return res.status(400).json({
                success: false,
                message: "Data wajib harus diisi"
            });
        }

        // Cek apakah pendaftaran ada
        const existingPendaftaran = await Pendaftaran.findByPk(id_pendaftaran);
        if (!existingPendaftaran) {
            return res.status(404).json({
                success: false,
                message: "Data pendaftaran tidak ditemukan"
            });
        }

        // Cek NISN duplikat (kecuali dengan data sendiri)
        const duplicateNISN = await Pendaftaran.findOne({
            where: {
                nisn,
                id_pendaftaran: { [Op.ne]: id_pendaftaran }
            }
        });

        if (duplicateNISN) {
            return res.status(400).json({
                success: false,
                message: "NISN sudah terdaftar"
            });
        }

        // Update data user
        const user = await User.findOne({
            where: { username: existingPendaftaran.nisn }
        });

        if (user) {
            await user.update({
                fullname: nama_siswa,
                email: email || null,
                username: nisn, // Update username jika NISN berubah
                phone: nomor_telepon,
                address: alamat,
                id_jenis_kelamin: parseInt(id_jenis_kelamin)
            });
        }

        // Update data pendaftaran
        await existingPendaftaran.update({
            nisn,
            nama_siswa,
            tempat_lahir,
            tanggal_lahir,
            id_jenis_kelamin: parseInt(id_jenis_kelamin),
            nama_ayah: nama_ayah || null,
            nama_ibu: nama_ibu || null,
            nomor_telepon,
            alamat,
            id_provinsi: parseInt(id_provinsi),
            id_kabupaten_kota: parseInt(id_kabupaten_kota),
            id_kecamatan: parseInt(id_kecamatan),
            id_kelurahan: parseInt(id_kelurahan),
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            id_sekolah_asal: id_sekolah_asal ? parseInt(id_sekolah_asal) : null,
            sekolah_asal, // Tambahkan sekolah_asal di sini
            id_sekolah_tujuan: parseInt(id_sekolah_tujuan),
            id_jalur_pendaftaran: parseInt(id_jalur_pendaftaran),
            tahun_lulus: parseInt(tahun_lulus),
            ...pendaftaranData
        });

        // Ambil data yang sudah diupdate dengan relasinya
        const updatedPendaftaran = await Pendaftaran.findByPk(id_pendaftaran, {
            include: [
                { model: JenisKelamin },
                { model: Provinsi },
                { model: KabupatenKota },
                { model: Kecamatan },
                { model: Kelurahan },
                { 
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    include: [{ model: TipeSekolah }]
                },
                { 
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    include: [{ model: TipeSekolah }]
                },
                { model: JalurPendaftaran }
            ]
        });

        res.status(200).json({
            success: true,
            message: "Data pendaftaran berhasil diupdate",
            data: updatedPendaftaran
        });
    } catch (error) {
        console.error('Error updating pendaftaran:', error);
        res.status(500).json({
            success: false,
            message: "Gagal mengupdate data pendaftaran",
            error: error.message
        });
    }
};

// Controller untuk mendapatkan semua data siswa diterima untuk semua sekolah
export const getDiterimaAll = async (req, res) => {
    try {
      // Ambil semua sekolah dengan include tipe sekolah dan lokasi
      const sekolahList = await Sekolah.findAll({
        include: [
          { model: TipeSekolah },
          { model: Provinsi },
          { model: KabupatenKota },
          { model: Kecamatan },
          { model: Kelurahan }
        ],
        order: [['id_sekolah', 'ASC']]
      });
  
      // Ambil semua pendaftaran yang diterima dalam satu query
      const pendaftaranDiterima = await Pendaftaran.findAll({
        where: {
          is_diterima: 1
        },
        include: [
          { model: JenisKelamin },
          { 
            model: Sekolah,
            as: 'sekolah_asal_data'
          },
          { 
            model: Sekolah,
            as: 'sekolah_tujuan_data'
          },
          { model: JalurPendaftaran }
        ],
        order: [['waktu_daftar', 'DESC']]
      });
  
      // Kelompokkan pendaftaran berdasarkan sekolah tujuan
      const pendaftaranBySekolah = {};
      pendaftaranDiterima.forEach(pendaftaran => {
        const idSekolahTujuan = pendaftaran.id_sekolah_tujuan;
        if (!pendaftaranBySekolah[idSekolahTujuan]) {
          pendaftaranBySekolah[idSekolahTujuan] = [];
        }
        pendaftaranBySekolah[idSekolahTujuan].push(pendaftaran);
      });
  
      // Gabungkan data sekolah dengan pendaftaran
      const result = sekolahList.map(sekolah => {
        const pendaftaranData = pendaftaranBySekolah[sekolah.id_sekolah] || [];
        
        // Hitung jumlah per jalur
        const counts = { zonasi: 0, prestasi: 0, pindahan: 0, afirmasi: 0, reguler: 0 };
        
        pendaftaranData.forEach(pendaftaran => {
          const jalur = pendaftaran.jalur_pendaftaran?.nama;
          if (jalur) {
            switch(jalur.toLowerCase()) {
              case 'zonasi':
                counts.zonasi++; 
                break;
              case 'prestasi':
                counts.prestasi++;
                break;
              case 'pindahan':
                counts.pindahan++;
                break;
              case 'afirmasi':
                counts.afirmasi++;
                break;
              case 'reguler':
                counts.reguler++;
                break;
            }
          }
        });
  
        // Hitung total
        const total = counts.zonasi + counts.prestasi + counts.pindahan + counts.afirmasi + counts.reguler;
  
        return {
          id_sekolah: sekolah.id_sekolah,
          sekolah: sekolah.nama || '-',
          npsn: sekolah.npsn,
          ...counts,
          total,
          tipe_sekolah: sekolah.tipe_sekolah,
          pendaftaran: formatPendaftaranResponse(pendaftaranData) // Format data pendaftaran
        };
      });
  
      return res.status(200).json({
        status: true,
        message: "Data siswa diterima berhasil diambil",
        data: result
      });
    } catch (error) {
      console.error('Error getDiterimaAll:', error);
      return res.status(500).json({
        status: false,
        message: "Terjadi kesalahan saat mengambil data",
        error: error.message
      });
    }
  };
  // Fungsi untuk mendapatkan data grafik berdasarkan jenjang
export const getPendaftaranGrafik = async (req, res) => {
    try {
      const { jenjang } = req.params;
      
      // Validasi jenjang
      if (!['TK', 'SD', 'SMP'].includes(jenjang)) {
        return res.status(400).json({
          status: false,
          message: "Jenjang tidak valid. Gunakan TK, SD, atau SMP"
        });
      }
  
      // Mapping id_tipe_sekolah berdasarkan jenjang
      const tipeSekolahIds = {
        'TK': [112, 122],
        'SD': [211, 212, 221, 222],
        'SMP': [311, 312, 321, 322]
      };
  
      // Ambil semua sekolah dengan filter jenjang
      const sekolahList = await Sekolah.findAll({
        include: [
          { 
            model: TipeSekolah,
            where: {
              id_tipe_sekolah: {
                [Op.in]: tipeSekolahIds[jenjang]
              }
            }
          }
        ],
        order: [['nama', 'ASC']]
      });
  
      // Ambil semua pendaftaran yang diterima untuk sekolah dengan jenjang yang sesuai
      const pendaftaranData = await Pendaftaran.findAll({
        include: [
          { 
            model: Sekolah,
            as: 'sekolah_tujuan_data',
            include: [
              {
                model: TipeSekolah,
                where: {
                  id_tipe_sekolah: {
                    [Op.in]: tipeSekolahIds[jenjang]
                  }
                }
              }
            ]
          },
          { model: JalurPendaftaran }
        ]
      });
  
      // Kelompokkan pendaftaran berdasarkan sekolah
      const pendaftaranBySekolah = {};
      pendaftaranData.forEach(pendaftaran => {
        const idSekolahTujuan = pendaftaran.id_sekolah_tujuan;
        if (!pendaftaranBySekolah[idSekolahTujuan]) {
          pendaftaranBySekolah[idSekolahTujuan] = [];
        }
        pendaftaranBySekolah[idSekolahTujuan].push(pendaftaran);
      });
  
      // Format data untuk grafik
      const formattedData = sekolahList.map(sekolah => {
        const pendaftaranSekolah = pendaftaranBySekolah[sekolah.id_sekolah] || [];
        
        // Hitung jumlah pendaftar per jalur
        const jalurCounts = {
          pendaftar_zonasi: 0,
          pendaftar_prestasi: 0,
          pendaftar_pindahan: 0,
          pendaftar_afirmasi: 0,
          pendaftar_reguler: 0
        };
        
        pendaftaranSekolah.forEach(pendaftaran => {
          const jalur = pendaftaran.jalur_pendaftaran?.nama?.toLowerCase();
          
          if (jalur === 'zonasi') jalurCounts.pendaftar_zonasi++;
          else if (jalur === 'prestasi') jalurCounts.pendaftar_prestasi++;
          else if (jalur === 'pindahan') jalurCounts.pendaftar_pindahan++;
          else if (jalur === 'afirmasi') jalurCounts.pendaftar_afirmasi++;
          else if (jalur === 'reguler') jalurCounts.pendaftar_reguler++;
        });
        
        // Untuk TK, jika tidak ada jalur reguler, hitung total pendaftar sebagai pendaftar reguler
        if (jenjang === 'TK' && jalurCounts.pendaftar_reguler === 0) {
          jalurCounts.pendaftar_reguler = pendaftaranSekolah.length;
        }
  
        // Hitung total pendaftar
        const totalPendaftar = Object.values(jalurCounts).reduce((a, b) => a + b, 0);
        
        // Hanya return sekolah dengan pendaftar atau pagu yang ada
        const result = {
          nama_sekolah: sekolah.nama,
          ...jalurCounts,
          // Data pagu dari sekolah
          pagu_zonasi: parseInt(sekolah.zonasi) || 0,
          pagu_prestasi: parseInt(sekolah.prestasi) || 0,
          pagu_afirmasi: parseInt(sekolah.afirmasi) || 0,
          pagu_pindahan: parseInt(sekolah.pindahan) || 0,
          pagu_reguler: jenjang === 'TK' ? (parseInt(sekolah.reguler) || 0) : 0
        };
        
        // Hitung total pagu
        const totalPagu = result.pagu_zonasi + result.pagu_prestasi + 
                          result.pagu_afirmasi + result.pagu_pindahan + 
                          result.pagu_reguler;
        
        // Hanya tampilkan sekolah yang memiliki pendaftar atau pagu
        return (totalPendaftar > 0 || totalPagu > 0) ? result : null;
      }).filter(Boolean); // Filter null values
  
      return res.status(200).json({
        status: true,
        message: `Data grafik untuk jenjang ${jenjang} berhasil diambil`,
        data: formattedData
      });
    } catch (error) {
      console.error('Error getPendaftaranGrafik:', error);
      return res.status(500).json({
        status: false,
        message: "Terjadi kesalahan saat mengambil data grafik",
        error: error.message
      });
    }
  };

  /**
 * Mengambil semua data pendaftaran berdasarkan sekolah tujuan
 */
export const getAllPendaftaranBySekolah = async (req, res) => {
    try {
        const idSekolahTujuan = req.params.id_sekolah_tujuan;
        if (!idSekolahTujuan) {
            return res.status(400).json({
                status: false,
                message: "ID Sekolah Tujuan harus diisi"
            });
        }

        // Mengambil semua data pendaftaran tanpa filter is_diterima
        const pendaftaran = await Pendaftaran.findAll({
            where: {
                id_sekolah_tujuan: idSekolahTujuan
                // Tidak ada filter is_diterima di sini
            },
            include: [
                {
                    model: JenisKelamin,
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_asal_data',
                    attributes: ['nama']
                },
                {
                    model: Sekolah,
                    as: 'sekolah_tujuan_data',
                    attributes: ['nama', 'npsn']
                },
                {
                    model: JalurPendaftaran,
                    attributes: ['id_jalur_pendaftaran', 'nama']
                }
            ],
            order: [['waktu_daftar', 'DESC']]
        });

        const formattedData = formatPendaftaranResponse(pendaftaran);

        return res.status(200).json({
            status: true,
            message: "Semua data pendaftaran berhasil diambil",
            data: formattedData
        });

    } catch (error) {
        console.error('Error in getAllPendaftaranBySekolah:', error);
        return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan saat mengambil data pendaftaran",
            error: error.message
        });
    }
}