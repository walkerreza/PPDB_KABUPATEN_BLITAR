import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const Tentang = db.define("tentang", {
    id_tentang: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    judul: {
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

export default Tentang;