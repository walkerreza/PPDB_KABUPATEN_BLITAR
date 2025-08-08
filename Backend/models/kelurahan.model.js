import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import Kecamatan from "./kecamatan.model.js";

const { DataTypes } = Sequelize;
const Kelurahan = db.define('kelurahan', {
    id_kelurahan: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    nama_kelurahan: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_kecamatan: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Kecamatan,
        key: 'id_kecamatan'
      }
    }
},{
    timestamps: false,
    freezeTableName: true
});

// Relasi
Kelurahan.belongsTo(Kecamatan, { 
    foreignKey: 'id_kecamatan'
});
  
export default Kelurahan;