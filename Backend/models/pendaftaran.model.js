import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import JenisKelamin from "./jenis_kelamin.model.js";
import Provinsi from "./provinsi.model.js";
import KabupatenKota from "./kabupaten_kota.model.js";
import Kecamatan from "./kecamatan.model.js";
import Kelurahan from "./kelurahan.model.js";
import JalurPendaftaran from "./jalur_pendaftaran.model.js";
import Sekolah from "./sekolah.model.js";
import User from "./user.model.js";
import TipeSekolah from "./tipe_sekolah.model.js";

const { DataTypes } = Sequelize;
const Pendaftaran = db.define("pendaftaran", {
    id_pendaftaran: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    no_pendaftaran: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nik: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    nisn: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nama_siswa: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    id_jenis_kelamin: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: JenisKelamin,
            key: 'id_jenis_kelamin'
        }
    },
    tempat_lahir: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tanggal_lahir: {
        type: 'DATE',
        allowNull: false
    },
    nama_ayah: {
        type: DataTypes.STRING(100),
    },
    nama_ibu: {
        type: DataTypes.STRING(100),
    },
    nomor_telepon: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    id_provinsi: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Provinsi,
            key: 'id_provinsi'
        }
    },
    id_kabupaten_kota: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: KabupatenKota,
            key: 'id_kabupaten_kota'
        }
    },
    id_kecamatan: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Kecamatan,
            key: 'id_kecamatan'
        }
    },
    id_kelurahan: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Kelurahan,
            key: 'id_kelurahan'
        }
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,  
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    sesuai_titik_dapodik: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_jalur_pendaftaran: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: JalurPendaftaran,
            key: 'id_jalur_pendaftaran'
        }
    },
    id_tipe_sekolah_asal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: TipeSekolah,
            key: 'id_tipe_sekolah'
        }
    },
    id_sekolah_asal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Sekolah,
            key: 'id_sekolah'
        }
    },
    sekolah_asal: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    tahun_lulus: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    id_sekolah_tujuan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Sekolah,
            key: 'id_sekolah'
        }
    },
    jarak_sekolah_tujuan: {
        type: DataTypes.DECIMAL(4,2),
        allowNull: true,
    },
    nilai_bhs_indonesia: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    nilai_bhs_inggris: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    nilai_matematika: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    nilai_ipa: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    dok_kk: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_ijazah: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_skhun: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_transkrip: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_piagam: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_prestasi: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_skpindah: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_skdomisili: {
        type: DataTypes.STRING
    },
    dok_pkh: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_kks: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_kip: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_kis: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_foto: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dok_akta: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id_user'
        }
    },
    waktu_daftar: {
        type: 'TIMESTAMP',
        allowNull: true
    },
    is_diterima: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    waktu_diterima: {
        type: 'TIMESTAMP',
        allowNull: true
    }
},{
    timestamps: false,
    freezeTableName: true
})

// Relasi
Pendaftaran.belongsTo(JenisKelamin, { 
    foreignKey: 'id_jenis_kelamin'
});
Pendaftaran.belongsTo(Provinsi, { 
    foreignKey: 'id_provinsi'
});
Pendaftaran.belongsTo(KabupatenKota, { 
    foreignKey: 'id_kabupaten_kota'
});
Pendaftaran.belongsTo(Kecamatan, { 
    foreignKey: 'id_kecamatan'
});
Pendaftaran.belongsTo(Kelurahan, { 
    foreignKey: 'id_kelurahan'
});
Pendaftaran.belongsTo(JalurPendaftaran, { 
    foreignKey: 'id_jalur_pendaftaran'
});
Pendaftaran.belongsTo(TipeSekolah, {
    foreignKey: 'id_tipe_sekolah_asal'
});
Pendaftaran.belongsTo(Sekolah, {
    foreignKey: 'id_sekolah_asal',
    as: 'sekolah_asal_data'
});
Pendaftaran.belongsTo(Sekolah, {
    foreignKey: 'id_sekolah_tujuan',
    as: 'sekolah_tujuan_data'
});
Pendaftaran.belongsTo(User, {
    foreignKey: 'id_user'
});

export default Pendaftaran