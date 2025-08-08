import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const JadwalPendaftaran = db.define("jadwal_pendaftaran", {
    id_jadwal_pendaftaran: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tanggal_mulai: {
        type: 'TIMESTAMP',
        allowNull: false
    },
    tanggal_selesai: {
        type: 'TIMESTAMP',
        allowNull: false
    },
    event: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },//sebagai model status jadwal pendaftaran, 1 untuk aktif, 0 untuk non aktif dan sebagai fungsi switch untuk tab penjadwalan ppdb frontend
    is_public: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },//sebagai model untuk switch on off di tab penjadawalan sistem
    
},{
    timestamps: false,
    freezeTableName: true
});

export default JadwalPendaftaran;