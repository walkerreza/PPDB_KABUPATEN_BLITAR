import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const GrupUser = db.define("grup_user", {
    id_grup_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nama: {
        type: DataTypes.STRING(100),
    }
},{
    timestamps: false,
    freezeTableName: true
});

export default GrupUser;