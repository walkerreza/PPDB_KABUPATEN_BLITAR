import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const DataPenduduk = sequelize.define('data_penduduk', {
    id_data_penduduk: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nik: {
        type: DataTypes.CHAR(16),
        allowNull: false,
        unique: true
    },
    nisn: {
        type: DataTypes.CHAR(10),
        allowNull: false,
        unique: true
    },
    nama_siswa: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    kelamin: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        validate: {
            isIn: [['L', 'P']]
        }
    },
    tempat_lahir: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    tanggal_lahir: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    agama: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    provinsi: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    kabupaten_kota: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    kecamatan: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    kelurahan: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    alamat: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    kode_pos: {
        type: DataTypes.CHAR(5),
        allowNull: false
    },
    nomor_telepon: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    nomor_hp: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    nama_ayah: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    nama_ibu: {
        type: DataTypes.STRING(200),
        allowNull: true
    }
}, {
    tableName: 'data_penduduk',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default DataPenduduk;
