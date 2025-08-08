import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import KabupatenKota from "./kabupaten_kota.model.js";

const { DataTypes } = Sequelize;
const Kecamatan = db.define('kecamatan', {
    id_kecamatan: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    nama_kecamatan: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_kabupaten_kota: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: KabupatenKota,
        key: 'id_kabupaten_kota'
      }
    }
},{
    timestamps: false,
    freezeTableName: true
});

// Relasi
Kecamatan.belongsTo(KabupatenKota, { 
    foreignKey: 'id_kabupaten_kota'
});
  
export default Kecamatan;  