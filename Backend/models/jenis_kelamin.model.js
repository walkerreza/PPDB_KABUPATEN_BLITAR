import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const JenisKelamin = db.define("jenis_kelamin", {
    id_jenis_kelamin: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nama: {
        type: DataTypes.STRING(50),
    }
},{
    timestamps: false,
    freezeTableName: true
});

export default JenisKelamin;