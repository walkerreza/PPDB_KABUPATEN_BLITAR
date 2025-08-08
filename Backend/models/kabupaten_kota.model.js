import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import Provinsi from "./provinsi.model.js";

const { DataTypes } = Sequelize;
const KabupatenKota = db.define('kabupaten_kota', {
    id_kabupaten_kota: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    nama_kabupaten_kota: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_provinsi: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Provinsi,
        key: 'id_provinsi'
      }
    }
},{
    timestamps: false,
    freezeTableName: true
});

// Relasi
KabupatenKota.belongsTo(Provinsi, { 
    foreignKey: 'id_provinsi'
});
  
export default KabupatenKota;