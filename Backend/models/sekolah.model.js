import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import TipeSekolah from "./tipe_sekolah.model.js";
import Provinsi from "./provinsi.model.js";
import KabupatenKota from "./kabupaten_kota.model.js";
import Kecamatan from "./kecamatan.model.js";
import Kelurahan from "./kelurahan.model.js";

const { DataTypes } = Sequelize;
const Sekolah = db.define("sekolah", {
    id_sekolah: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_tipe_sekolah: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TipeSekolah,
            key: 'id_tipe_sekolah'
        }
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    npsn: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    zonasi: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    prestasi: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    pindahan: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    afirmasi: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    reguler: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    id_provinsi: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: Provinsi,
            key: 'id_provinsi'
        }
    },
    id_kabupaten_kota: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: KabupatenKota,
            key: 'id_kabupaten_kota'
        }
    },
    id_kecamatan: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: Kecamatan,
            key: 'id_kecamatan'
        }
    },
    id_kelurahan: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: Kelurahan,
            key: 'id_kelurahan'
        }
    }
},{
    timestamps: false,
    freezeTableName: true
});

// Definisikan relasi
Sekolah.belongsTo(TipeSekolah, {
    foreignKey: 'id_tipe_sekolah',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

Sekolah.belongsTo(Provinsi, {
    foreignKey: 'id_provinsi'
});

Sekolah.belongsTo(KabupatenKota, {
    foreignKey: 'id_kabupaten_kota'
});

Sekolah.belongsTo(Kecamatan, {
    foreignKey: 'id_kecamatan'
});

Sekolah.belongsTo(Kelurahan, {
    foreignKey: 'id_kelurahan'
});

export default Sekolah;