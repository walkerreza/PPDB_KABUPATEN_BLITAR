import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const Informasi = db.define("informasi", {
    id_informasi: {
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

export default Informasi;