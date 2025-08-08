import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const Banner = db.define("banner", {
    id_banner: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    judul: {
        type: DataTypes.STRING(100),
    },
    gambar: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.INTEGER,
    },
},{
    timestamps: false,
    freezeTableName: true
});

export default Banner;