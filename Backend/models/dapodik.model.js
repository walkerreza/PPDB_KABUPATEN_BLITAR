import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const Dapodik = db.define("dapodik", {
    id_dapodik: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nik: {
        type: DataTypes.STRING(100),
    },
    nisn: {
        type: DataTypes.STRING(100),
    },
    nama_siswa: {
        type: DataTypes.STRING(100),
    },
    jenis_kelamin: {
        type: DataTypes.CHAR(1),
        validate: {
            isIn: [['L', 'P']]
        }
    },
    tempat_lahir: {
        type: DataTypes.STRING(100)
    },
    tanggal_lahir: {
        type: DataTypes.DATE
    },
    no_kk: {
        type: DataTypes.STRING(100)
    },
    agama: {
        type: DataTypes.STRING(50)
    },
    kebutuhan_khusus: {
        type: DataTypes.STRING(100)
    },
    no_akta_lahir: {
        type: DataTypes.STRING(100)
    },
    nomor_telepon: {
        type: DataTypes.STRING(100)
    },
    alamat_jalan: {
        type: DataTypes.STRING(255)
    },
    provinsi: {
        type: DataTypes.STRING(100)
    },
    kabupaten_kota: {
        type: DataTypes.STRING(100),
    },
    Kecamatan: {
        type: DataTypes.STRING(100)
    },
    Kelurahan: {
        type: DataTypes.STRING(100)
    },
    dusun: {
        type: DataTypes.STRING(100)
    },
    rt: {
        type: DataTypes.STRING(100)
    },
    rw: {
        type: DataTypes.STRING(100)
    },
    kode_pos: {
        type: DataTypes.STRING(100)
    },
    latitude: {
        type: DataTypes.DOUBLE,
    },
    longitude: {
        type: DataTypes.DOUBLE,
    },
    jenis_domisili: {
        type: DataTypes.STRING(100),
    },
    alat_transportasi: {
        type: DataTypes.STRING(100),
    },
    anak_ke: {
        type: DataTypes.INTEGER,
    },
    jumlah_saudara_kandung: {
        type: DataTypes.INTEGER
    },
    sekolah_asal: {
        type: DataTypes.STRING(255),
    },
    jarak_rumah_ke_sekolah: {
        type: DataTypes.DECIMAL(4,2),
    },
    nama_rombel: {
        type: DataTypes.STRING(100),
    },
    nipd: {
        type: DataTypes.STRING(100),
    },
    tinggi_badan: {
        type: DataTypes.INTEGER,
    },
    berat_badan: {
        type: DataTypes.INTEGER
    },
    lingkar_kepala: {
        type: DataTypes.INTEGER
    },
    nik_ayah: {
        type: DataTypes.STRING(100)
    },
    nama_ayah: {
        type: DataTypes.STRING(100)
    },
    tahun_lahir_ayah: {
        type: DataTypes.INTEGER,
    },
    pendidikan_terakhir_ayah: {
        type: DataTypes.STRING(50),
    },
    pekerjaan_ayah: {
        type: DataTypes.STRING(50),
    },
    penghasilan_ayah: {
        type: DataTypes.STRING(50)
    },
    nik_ibu: {
        type: DataTypes.STRING(100),
    },
    nama_ibu: {
        type: DataTypes.STRING(100),
    },
    tahun_lahir_ibu: {
        type: DataTypes.INTEGER,
    },
    pendidikan_terakhir_ibu: {
        type: DataTypes.STRING(50),
    },
    pekerjaan_ibu: {
        type: DataTypes.STRING(50),
    },
    penghasilan_ibu: {
        type: DataTypes.STRING(50)
    },
    nik_wali: {
        type: DataTypes.STRING(100),
    },
    nama_wali: {
        type: DataTypes.STRING(100),
    },
    tahun_lahir_wali: {
        type: DataTypes.INTEGER,
    },
    pendidikan_terakhir_wali: {
        type: DataTypes.STRING(50),
    },
    pekerjaan_wali: {
        type: DataTypes.STRING(50),
    },
    penghasilan_wali: {
        type: DataTypes.STRING(50)
    },
    penerima_kps: {
        type: DataTypes.INTEGER
    },
    no_kps: {
        type: DataTypes.STRING(100)
    },
    layak_pip: {
        type: DataTypes.INTEGER
    },
    penerima_kip: {
        type: DataTypes.INTEGER
    },
    alasan_layak_pip: {
        type: DataTypes.STRING(255)
    }
}, {
    timestamps: false,
    freezeTableName: true
})

export default Dapodik;