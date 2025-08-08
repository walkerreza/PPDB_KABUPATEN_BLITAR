import { Sequelize } from "sequelize";
import db from "../config/db.config.js";

const { DataTypes } = Sequelize;
const NewsTicker = db.define("news_ticker", {
    id_news_ticker: {
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

export default NewsTicker;