import Dapodik from "../models/dapodik.model.js";
import { Op,Sequelize } from "sequelize";
import Provinsi from "../models/provinsi.model.js";
import KabupatenKota from "../models/kabupaten_kota.model.js";
import Kecamatan from "../models/kecamatan.model.js";
import Kelurahan from "../models/kelurahan.model.js";
import ExcelJS from 'exceljs';


/**
 * Controller untuk mengelola data Dapodik
 */

// Mengambil semua data dapodik
export const getAllDapodik = async (req, res) => {
    try {
        const dapodik = await Dapodik.findAll({
            order: [['id_dapodik', 'DESC']]
        });
        res.json({message: "Berhasil mengambil semua data dapodik", data: dapodik});
    } catch (error) {
        console.error('Error in getAllDapodik:', error);
        res.status(500).json({ 
            message: error.message,
            error: "Gagal mengambil data dapodik"
        });
    }
};

// Mengambil satu data dapodik berdasarkan ID
export const getDapodikById = async (req, res) => {
    try {
        const dapodik = await Dapodik.findByPk(req.params.id);
        
        if (!dapodik) {
            return res.status(404).json({ 
                message: "Data dapodik tidak ditemukan" 
            });
        }
        
        res.json({message: "Berhasil mengambil data dapodik", data: dapodik});
    } catch (error) {
        console.error('Error in getDapodikById:', error);
        res.status(500).json({ 
            message: error.message,
            error: "Gagal mengambil data dapodik"
        });
    }
};

// Membuat data dapodik baru
export const createDapodik = async (req, res) => {
    try {
        const data = { ...req.body };
        
        // Log data yang diterima
        console.log('Data yang diterima:', data);

        // Validasi data sesuai model
        // Konversi nilai boolean ke integer
        if ('penerima_kps' in data) {
            data.penerima_kps = data.penerima_kps ? 1 : 0;
        }
        if ('layak_pip' in data) {
            data.layak_pip = data.layak_pip ? 1 : 0;
        }
        if ('penerima_kip' in data) {
            data.penerima_kip = data.penerima_kip ? 1 : 0;
        }

        // Konversi nilai numerik
        const integerFields = ['tinggi_badan', 'berat_badan', 'lingkar_kepala', 'anak_ke', 
                             'tahun_lahir_ayah', 'tahun_lahir_ibu', 'tahun_lahir_wali', 
                             'jumlah_saudara_kandung'];
        integerFields.forEach(field => {
            if (data[field]) {
                data[field] = parseInt(data[field]) || null;
            }
        });

        // Konversi nilai decimal
        const decimalFields = ['latitude', 'longitude', 'jarak_rumah_ke_sekolah'];
        decimalFields.forEach(field => {
            if (data[field]) {
                data[field] = parseFloat(data[field]) || null;
            }
        });

        // Validasi jenis kelamin
        if (data.jenis_kelamin) {
            data.jenis_kelamin = data.jenis_kelamin.toString().toUpperCase();
            if (!['L', 'P'].includes(data.jenis_kelamin)) {
                return res.status(400).json({
                    message: "Jenis kelamin harus 'L' atau 'P'"
                });
            }
        }
        
        // Validasi dan format tanggal
        if (data.tanggal_lahir) {
            try {
                // Hapus spasi dari tanggal
                const cleanDate = data.tanggal_lahir.replace(/\s+/g, '');
                console.log('Tanggal setelah dibersihkan:', cleanDate);
                
                // Coba parse tanggal
                let date;
                if (cleanDate.includes('T')) {
                    // Jika sudah dalam format ISO
                    date = new Date(cleanDate);
                } else if (cleanDate.includes('-')) {
                    // Format YYYY-MM-DD
                    const [year, month, day] = cleanDate.split('-');
                    date = new Date(year, month - 1, day);
                } else if (cleanDate.includes('/')) {
                    // Format DD/MM/YYYY atau MM/DD/YYYY
                    const parts = cleanDate.split('/');
                    if (parts.length === 3) {
                        // Asumsikan format DD/MM/YYYY
                        const [day, month, year] = parts;
                        date = new Date(year, month - 1, day);
                    }
                } else {
                    throw new Error('Format tanggal tidak dikenali');
                }

                if (!isNaN(date.getTime())) {
                    // Format ke ISO string untuk PostgreSQL
                    data.tanggal_lahir = date.toISOString();
                    console.log('Tanggal yang akan disimpan:', data.tanggal_lahir);
                } else {
                    throw new Error('Tanggal tidak valid');
                }
            } catch (error) {
                console.error('Error memformat tanggal:', error);
                return res.status(400).json({
                    message: "Format tanggal tidak valid",
                    error: error.message
                });
            }
        }

        // Pastikan string fields tidak kosong
        const stringFields = ['nik', 'nisn', 'nama_siswa', 'no_kk', 'no_akta_lahir', 
                            'nomor_telepon', 'rt', 'rw', 'kode_pos'];
        stringFields.forEach(field => {
            if (data[field]) {
                data[field] = data[field].toString().trim() || null;
            }
        });

        const dapodik = await Dapodik.create(data);
        res.status(201).json({
            message: "Data dapodik berhasil ditambahkan",
            data: dapodik
        });
    } catch (error) {
        console.error('Error in createDapodik:', error);
        res.status(500).json({ 
            message: error.message,
            error: "Gagal menambahkan data dapodik"
        });
    }
};

// Update data dapodik
export const updateDapodik = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    try {
      console.log('Update request untuk ID:', id);
      console.log('Data yang diterima:', data);

      // Ambil data existing
      const existingData = await Dapodik.findOne({
        where: { id_dapodik: id }
      });

      if (!existingData) {
        return res.status(404).json({
          message: "Data tidak ditemukan"
        });
      }

      console.log('Data existing:', existingData.toJSON());

      // Hapus properti yang tidak ada di model
      const allowedFields = Object.keys(Dapodik.rawAttributes);
      const cleanedData = {};
      
      for (const key of allowedFields) {
        if (data.hasOwnProperty(key)) {
          cleanedData[key] = data[key];
        }
      }

      console.log('Data yang akan diupdate:', cleanedData);

      // Update data menggunakan model.update
      await Dapodik.update(cleanedData, {
        where: { id_dapodik: id }
      });
      
      // Ambil data yang sudah diupdate
      const updatedData = await Dapodik.findOne({
        where: { id_dapodik: id }
      });

      console.log('Data setelah update:', updatedData.toJSON());

      res.json({
        message: "Berhasil mengupdate data dapodik",
        data: updatedData
      });
    } catch (error) {
      console.error('Error dalam updateDapodik:', error);
      res.status(500).json({
        message: "Terjadi kesalahan saat mengupdate data",
        error: error.message
      });
    }
};

// Menghapus data dapodik
export const deleteDapodik = async (req, res) => {
    try {
        const dapodik = await Dapodik.findByPk(req.params.id);

        if (!dapodik) {
            return res.status(404).json({ 
                message: "Data dapodik tidak ditemukan" 
            });
        }

        await Dapodik.destroy({
            where: {
                id_dapodik: req.params.id
            }
        });

        res.json({
            message: "Data dapodik berhasil dihapus"
        });
    } catch (error) {
        console.error('Error in deleteDapodik:', error);
        res.status(500).json({ 
            message: error.message,
            error: "Gagal menghapus data dapodik"
        });
    }
};

// Mencari data dapodik berdasarkan nama atau NISN
export const searchDapodik = async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search) {
            return res.status(400).json({
                message: "Kata kunci pencarian harus diisi"
            });
        }
        
        const dapodik = await Dapodik.findAll({
            where: {
                [Op.or]: [
                    { 
                        nama_siswa: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    { 
                        nisn: {
                            [Op.like]: `%${search}%`
                        }
                    }
                ]
            },
            order: [['id_dapodik', 'DESC']]
        });
        
        res.json(dapodik);
    } catch (error) {
        console.error('Error in searchDapodik:', error);
        res.status(500).json({ 
            message: error.message,
            error: "Gagal mencari data dapodik"
        });
    }
};
// Mencari data dapodik berdasarkan NIK dengan data wilayah
export const findDapodikByNIK = async (req, res) => {
    try {
        const { nik } = req.params;

        // Cari data dapodik
        const dapodik = await Dapodik.findOne({
            where: { nik }
        });

        if (!dapodik) {
            return res.status(404).json({
                message: "Data dapodik tidak ditemukan"
            });
        }

        console.log('Data dapodik:', dapodik.dataValues); // Debugging

        // Cari data wilayah
        try {
            // 1. Cari provinsi (JAWA TIMUR)
            const provinsi = await Provinsi.findOne({
                where: Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('nama_provinsi')),
                    'LIKE',
                    `%${dapodik.provinsi?.toLowerCase().trim()}%`
                )
            });

            // 2. Cari kabupaten yang mengandung kata kunci dari dapodik
            const searchKeyword = dapodik.kabupaten_kota;
            
            console.log('Mencari kabupaten dengan keyword:', searchKeyword); // Debugging
            
            const kabupaten = await KabupatenKota.findOne({
                where: Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('nama_kabupaten_kota')),
                    'LIKE',
                    `%${searchKeyword.toLowerCase()}%`
                )
            });

            if (!kabupaten) {
                throw new Error(`Kabupaten dengan keyword "${searchKeyword}" tidak ditemukan`);
            }

            // 3. Cari kecamatan berdasarkan nama
            const kecamatan = await Kecamatan.findOne({
                where: Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('nama_kecamatan')),
                    'LIKE',
                    `%${dapodik.Kecamatan?.toLowerCase().trim()}%`
                )
            });

            // 4. Cari kelurahan berdasarkan nama
            const kelurahan = kecamatan ? await Kelurahan.findOne({
                where: Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('nama_kelurahan')),
                    'LIKE',
                    `%${dapodik.Kelurahan?.toLowerCase().trim()}%`
                )
            }) : null;

            console.log('Data wilayah yang ditemukan:', { // Debugging
                provinsi: provinsi?.dataValues,
                kabupaten: kabupaten?.dataValues,
                kecamatan: kecamatan?.dataValues,
                kelurahan: kelurahan?.dataValues
            });

            // Gabungkan data dapodik dengan data wilayah
            const result = {
                ...dapodik.dataValues,
                id_provinsi: provinsi.id_provinsi,
                id_kabupaten_kota: kabupaten.id_kabupaten_kota,
                id_kecamatan: kecamatan?.id_kecamatan || null,
                id_kelurahan: kelurahan?.id_kelurahan || null,
                // Tambahkan nama wilayah untuk referensi
                nama_provinsi: provinsi.nama_provinsi,
                nama_kabupaten_kota: kabupaten.nama_kabupaten_kota,
                nama_kecamatan: kecamatan?.nama_kecamatan || null,
                nama_kelurahan: kelurahan?.nama_kelurahan || null
            };

            console.log('Data yang dikirim:', result); // Debugging

            res.json(result);
        } catch (error) {
            console.error('Error saat mencari data wilayah:', error);
            // Jika terjadi error saat mencari data wilayah, tetap kirim data dapodik
            res.json({
                ...dapodik.dataValues,
                id_provinsi: null,
                id_kabupaten_kota: null,
                id_kecamatan: null,
                id_kelurahan: null,
                nama_provinsi: null,
                nama_kabupaten_kota: null,
                nama_kecamatan: null,
                nama_kelurahan: null,
                error_wilayah: error.message
            });
        }
    } catch (error) {
        console.error('Error in findDapodikByNIK:', error);
        res.status(500).json({
            message: error.message,
            error: "Gagal mencari data dapodik"
        });
    }
};

// Mengekspor template dapodik ke Excel
export const downloadTemplate = async (req, res) => {
    try {
        // Membuat workbook baru
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Dapodik', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 9, topLeftCell: 'A10', activeCell: 'A10' }]
        });
        
        // Definisi kolom yang akan digunakan di Excel
        const columns = [
            // Data Pribadi
            { header: 'NIK', key: 'nik', width: 20 },
            { header: 'NISN', key: 'nisn', width: 15 },
            { header: 'Nama Siswa', key: 'nama_siswa', width: 30 },
            { header: 'Jenis Kelamin (L/P)', key: 'jenis_kelamin', width: 15 },
            { header: 'Tempat Lahir', key: 'tempat_lahir', width: 20 },
            { header: 'Tanggal Lahir   (DD/MM/YYYY)', key: 'tanggal_lahir', width: 25 },
            { header: 'No KK', key: 'no_kk', width: 20 },
            { header: 'Agama', key: 'agama', width: 15 },
            { header: 'Kebutuhan Khusus (Ada/Tidak Ada)', key: 'kebutuhan_khusus', width: 20 },
            { header: 'No Akta Lahir', key: 'no_akta_lahir', width: 20 },
            { header: 'Nomor Telepon', key: 'nomor_telepon', width: 20 },

            // Data Fisik
            { header: 'Tinggi Badan', key: 'tinggi_badan', width: 15 },
            { header: 'Berat Badan', key: 'berat_badan', width: 15 },
            { header: 'Lingkar Kepala', key: 'lingkar_kepala', width: 15 },
            { header: 'Jarak Rumah ke Sekolah', key: 'jarak_rumah_ke_sekolah', width: 25 },
            { header: 'Jumlah Saudara Kandung', key: 'jumlah_saudara_kandung', width: 15 },
            { header: 'Anak Ke', key: 'anak_ke', width: 15 },

            // Data Sekolah
            { header: 'Sekolah Asal', key: 'sekolah_asal', width: 30 },
            { header: 'Nama Rombel', key: 'nama_rombel', width: 20 },
            { header: 'NIPD', key: 'nipd', width: 20 },

            // Lokasi Tempat Tinggal
            { header: 'Alamat Jalan', key: 'alamat_jalan', width: 40 },
            { header: 'Provinsi', key: 'provinsi', width: 20 },
            { header: 'Kabupaten/Kota', key: 'kabupaten_kota', width: 20 },
            { header: 'Kecamatan', key: 'Kecamatan', width: 20 },
            { header: 'Kelurahan', key: 'Kelurahan', width: 20 },
            { header: 'Dusun', key: 'dusun', width: 20 },
            { header: 'RT', key: 'rt', width: 10 },
            { header: 'RW', key: 'rw', width: 10 },
            { header: 'Kode Pos', key: 'kode_pos', width: 10 },
            { header: 'Latitude', key: 'latitude', width: 15 },
            { header: 'Longitude', key: 'longitude', width: 15 },
            { header: 'Jenis Domisili', key: 'jenis_domisili', width: 20 },
            { header: 'Alat Transportasi', key: 'alat_transportasi', width: 20 },

            // Data Ayah
            { header: 'NIK Ayah', key: 'nik_ayah', width: 20 },
            { header: 'Nama Ayah', key: 'nama_ayah', width: 30 },
            { header: 'Tahun Lahir Ayah', key: 'tahun_lahir_ayah', width: 15 },
            { header: 'Pendidikan Terakhir Ayah', key: 'pendidikan_terakhir_ayah', width: 25 },
            { header: 'Pekerjaan Ayah', key: 'pekerjaan_ayah', width: 20 },
            { header: 'Penghasilan Ayah', key: 'penghasilan_ayah', width: 20 },

            // Data Ibu
            { header: 'NIK Ibu', key: 'nik_ibu', width: 20 },
            { header: 'Nama Ibu', key: 'nama_ibu', width: 30 },
            { header: 'Tahun Lahir Ibu', key: 'tahun_lahir_ibu', width: 15 },
            { header: 'Pendidikan Terakhir Ibu', key: 'pendidikan_terakhir_ibu', width: 25 },
            { header: 'Pekerjaan Ibu', key: 'pekerjaan_ibu', width: 20 },
            { header: 'Penghasilan Ibu', key: 'penghasilan_ibu', width: 20 },

            // Data Wali
            { header: 'NIK Wali', key: 'nik_wali', width: 20 },
            { header: 'Nama Wali', key: 'nama_wali', width: 30 },
            { header: 'Tahun Lahir Wali', key: 'tahun_lahir_wali', width: 15 },
            { header: 'Pendidikan Terakhir Wali', key: 'pendidikan_terakhir_wali', width: 25 },
            { header: 'Pekerjaan Wali', key: 'pekerjaan_wali', width: 20 },
            { header: 'Penghasilan Wali', key: 'penghasilan_wali', width: 20 },

            // Program Bantuan
            { header: 'Penerima KPS', key: 'penerima_kps', width: 20 },
            { header: 'No KPS', key: 'no_kps', width: 20 },
            { header: 'Layak PIP', key: 'layak_pip', width: 20 },
            { header: 'Penerima KIP', key: 'penerima_kip', width: 20 },
            { header: 'Alasan Layak PIP', key: 'alasan_layak_pip', width: 30 }
        ];

        // Mengatur worksheet properties
        worksheet.properties.defaultRowHeight = 25;
        
        // Menambahkan judul di baris pertama
        worksheet.getRow(1).values = ['TEMPLATE DATA DAPODIK PPDB KABUPATEN BLITAR'];
        worksheet.getRow(1).height = 30;
        worksheet.getRow(1).font = { size: 16, bold: true };
        worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A1:BK1');

        // Menambahkan petunjuk pengisian
        const petunjuk = [
            'PETUNJUK PENGISIAN:',
            '1. Jangan mengubah nama kolom',
            '2. Format pengisian:',
            '   - Penerima KPS/KIP/Layak PIP: diisi dengan "1" (Ya) atau "0" (Tidak)',
            '   - Penghasilan: gunakan format angka tanpa titik/koma',
            '3. Untuk kolom yang tidak memiliki data, biarkan kosong',
            ''  // Baris kosong setelah petunjuk
        ];

        // Menambahkan petunjuk dan mengatur style
        petunjuk.forEach((text, index) => {
            const rowNumber = index + 2;
            const row = worksheet.getRow(rowNumber);
            row.values = [text];
            row.font = { italic: true };
            row.alignment = { horizontal: 'left', vertical: 'middle' };
            worksheet.mergeCells(`A${rowNumber}:BK${rowNumber}`);
        });

        // Menambahkan dan mengatur header kolom di baris ke-9
        const headerRow = worksheet.getRow(9);
        headerRow.values = columns.map(col => col.header);
        headerRow.height = 30;
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        // Mengatur border dan warna untuk header
        headerRow.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6E6' }
            };
        });

        // Mengatur kolom setelah semua konten ditambahkan
        columns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            column.key = col.key;
            column.width = col.width || 15;
        });

        // Menambahkan validasi untuk beberapa kolom
        worksheet.getColumn('B').eachCell({ includeEmpty: true }, cell => {  // Kolom Jenis Kelamin
            if (cell.row > 9) {
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ['"L,P"']
                };
            }
        });

        worksheet.getColumn('H').eachCell({ includeEmpty: true }, cell => {  // Kolom Agama
            if (cell.row > 9) {
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ['"Islam,Kristen,Katolik,Hindu,Buddha,Konghucu"']
                };
            }
        });

        // Validasi untuk kolom Ya/Tidak
        ['AD', 'AF', 'AG'].forEach(col => {  // Kolom Penerima KPS, Layak PIP, Penerima KIP
            worksheet.getColumn(col).eachCell({ includeEmpty: true }, cell => {
                if (cell.row > 9) {
                    cell.dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: ['"Ya,Tidak"']
                    };
                }
            });
        });

        // Set response header
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=template_dapodik.xlsx'
        );

        // Mengirim file
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error in downloadTemplate:', error);
        res.status(500).json({
            message: error.message,
            error: "Gagal mengunduh template"
        });
    }
};

// Import data dari Excel
export const importExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "File Excel tidak ditemukan"
            });
        }

        console.log('File diterima:', req.file.originalname);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return res.status(400).json({
                message: "Sheet tidak ditemukan dalam file Excel"
            });
        }

        console.log('Total baris:', worksheet.rowCount);
        const dataToProcess = [];

        // Dapatkan header dan mapping kolom (mulai dari baris ke-9)
        const headerRow = worksheet.getRow(9);
        const columnMapping = {};
        
        // Mapping nama kolom Excel ke nama field database
        const fieldMapping = {
            'jenis_kelamin_l/p': 'jenis_kelamin',
            'kebutuhan_khusus_ada/tidak_ada': 'kebutuhan_khusus',
            'tanggal_lahir_dd/mm/yyyy': 'tanggal_lahir',
            'kabupaten/kota': 'kabupaten_kota',
            'kecamatan': 'Kecamatan',
            'kelurahan': 'Kelurahan'
        };
        
        headerRow.eachCell((cell, colNumber) => {
            let headerText = cell.value?.toString().toLowerCase().trim();
            
            // Hapus tanda * jika ada
            headerText = headerText.replace(/\*/g, '')
                .replace(/\s+/g, '_')
                .replace(/[\(\)]/g, '');
            
            // Gunakan mapping jika ada
            let columnKey = fieldMapping[headerText] || headerText;
            
            columnMapping[colNumber] = columnKey;
            console.log(`Kolom ${colNumber}: ${headerText} -> ${columnKey}`);
        });

        console.log('Mapping kolom:', columnMapping);
        
        // Mulai dari baris ke-10 (setelah header)
        for (let rowNumber = 10; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const rowData = {};
            
            // Skip baris kosong
            if (row.values.filter(Boolean).length === 0) continue;

            // Proses setiap kolom berdasarkan mapping
            for (const [colNumber, dbField] of Object.entries(columnMapping)) {
                const cell = row.getCell(parseInt(colNumber));
                let value = cell.value;
                
                console.log(`Memproses kolom ${colNumber} (${dbField}):`, value);

                if (dbField === 'tanggal_lahir' && value) {
                    const dateStr = value.toString().trim();
                    console.log('Memproses tanggal:', dateStr);
                    
                    if (dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            const [day, month, year] = parts;
                            const formattedDay = day.padStart(2, '0');
                            const formattedMonth = month.padStart(2, '0');
                            
                            try {
                                const dateObj = new Date(`${year}-${formattedMonth}-${formattedDay}`);
                                if (!isNaN(dateObj.getTime())) {
                                    value = dateObj.toISOString().split('T')[0];
                                    console.log('Tanggal valid:', value);
                                } else {
                                    console.error('Tanggal tidak valid');
                                    value = null;
                                }
                            } catch (error) {
                                console.error('Error parsing tanggal:', error);
                                value = null;
                            }
                        }
                    }
                } else if (['penerima_kps', 'layak_pip', 'penerima_kip'].includes(dbField)) {
                    value = value === '1' || value === 1 ? 1 : 0;
                } else if (dbField === 'kebutuhan_khusus') {
                    value = value === 'Ada' ? 'Ada' : 'Tidak Ada';
                } else if (['tinggi_badan', 'berat_badan', 'lingkar_kepala', 'anak_ke', 'tahun_lahir_ayah', 'tahun_lahir_ibu', 'tahun_lahir_wali', 'jumlah_saudara_kandung'].includes(dbField)) {
                    const parsed = parseInt(value);
                    value = !isNaN(parsed) ? parsed : null;
                } else if (['latitude', 'longitude', 'jarak_rumah_ke_sekolah'].includes(dbField)) {
                    const parsed = parseFloat(value);
                    value = !isNaN(parsed) ? parsed : null;
                } else if (dbField === 'jenis_kelamin') {
                    value = value ? value.toString().toUpperCase().trim() : null;
                    if (value && !['L', 'P'].includes(value)) {
                        value = null;
                    }
                } else if (dbField === 'penghasilan_ayah' || dbField === 'penghasilan_ibu' || dbField === 'penghasilan_wali') {
                    if (value) {
                        value = value.toString()
                            .replace(/Rp\.\s?/g, '')
                            .replace(/,/g, '')
                            .replace(/\./g, '')
                            .replace(/\s/g, '')
                            .replace(/-/g, '');
                        const parsed = parseInt(value);
                        value = !isNaN(parsed) ? parsed : null;
                    }
                }

                if (value !== undefined) {
                    rowData[dbField] = value;
                }
            }

            // Hanya proses jika ada data
            if (Object.keys(rowData).length > 0) {
                console.log('Data yang akan diproses:', rowData);
                dataToProcess.push(rowData);
            }
        }

        console.log(`Akan memproses ${dataToProcess.length} data`);

        if (dataToProcess.length === 0) {
            return res.status(400).json({
                message: "Tidak ada data valid yang dapat diimpor"
            });
        }

        // Proses setiap data
        const results = {
            updated: 0,
            inserted: 0,
            failed: 0,
            errors: []
        };

        for (const data of dataToProcess) {
            try {
                if (!data.nik) {
                    console.log('Data tanpa NIK:', data);
                    results.failed++;
                    results.errors.push(`Baris dengan nama ${data.nama_siswa || 'tidak diketahui'} tidak memiliki NIK`);
                    continue;
                }

                try {
                    // Cek apakah data dengan NIK tersebut sudah ada
                    const existingData = await Dapodik.findOne({
                        where: { 
                            nik: data.nik.toString() // Pastikan NIK dalam bentuk string
                        }
                    });

                    console.log('Memproses data:', {
                        nik: data.nik,
                        nama: data.nama_siswa,
                        existing: !!existingData
                    });

                    if (existingData) {
                        // Update data yang sudah ada
                        await Dapodik.update(data, {
                            where: { 
                                nik: data.nik.toString() // Pastikan NIK dalam bentuk string
                            }
                        });
                        results.updated++;
                        console.log(`Berhasil update data dengan NIK: ${data.nik}, Nama: ${data.nama_siswa}`);
                    } else {
                        // Insert data baru, hapus id_dapodik agar autoIncrement bekerja
                        delete data.id_dapodik;
                        await Dapodik.create(data);
                        results.inserted++;
                        console.log(`Berhasil insert data baru dengan NIK: ${data.nik}, Nama: ${data.nama_siswa}`);
                    }
                } catch (error) {
                    console.error(`Error pada data dengan NIK ${data.nik}:`, error);
                    results.failed++;
                    results.errors.push(`Error pada NIK ${data.nik}: ${error.message}`);
                }
            } catch (error) {
                console.error(`Error pada data dengan NIK ${data.nik}:`, error);
                results.failed++;
                results.errors.push(`Error pada NIK ${data.nik}: ${error.message}`);
            }
        }

        res.json({
            message: `Berhasil memproses data dari Excel`,
            detail: `${results.inserted} data baru ditambahkan, ${results.updated} data diperbarui, ${results.failed} data gagal diproses`,
            errors: results.errors,
            results
        });

    } catch (error) {
        console.error('Error detail:', error);
        res.status(500).json({
            message: "Gagal mengimpor data: " + error.message,
            error: error.stack
        });
    }
};