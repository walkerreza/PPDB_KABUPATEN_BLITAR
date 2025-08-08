import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const Provinsi = db.define("provinsi", {
    id_provinsi: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    nama_provinsi: {
        type: DataTypes.STRING,
    }
},{
    timestamps: false,
    freezeTableName: true
});

export default Provinsi;