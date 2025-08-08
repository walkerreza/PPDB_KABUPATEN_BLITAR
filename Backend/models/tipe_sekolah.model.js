import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const TipeSekolah = db.define("tipe_sekolah", {
    id_tipe_sekolah: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    slug: {
        type: DataTypes.STRING(50),
    },
    nama: {
        type: DataTypes.STRING(50),
    }
},{
    timestamps: false,
    freezeTableName: true
});

export default TipeSekolah;