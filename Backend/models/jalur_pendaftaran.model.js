import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } =  Sequelize;
const JalurPendaftaran = db.define("jalur_pendaftaran", {
    id_jalur_pendaftaran: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nama: {
        type: DataTypes.STRING(100),
    },
    deskripsi: {
        type: DataTypes.TEXT,
    },
    status: {
        type: DataTypes.INTEGER,
    }
},{
    timestamps: false,
    freezeTableName: true
});

export default JalurPendaftaran;