import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import JenisKelamin from "./jenis_kelamin.model.js";
import GrupUser from "./grup_user.model.js";
import Sekolah from "./sekolah.model.js";

const { DataTypes } = Sequelize;
const User = db.define("user", {
    id_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fullname: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    photo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    id_jenis_kelamin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: JenisKelamin,
            key: 'id_jenis_kelamin'
        }
    },
    id_grup_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: GrupUser,
            key: 'id_grup_user'
        }
    },
    id_sekolah: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Sekolah,
            key: 'id_sekolah'
        }
    },
    status: {
        type: DataTypes.INTEGER,
    }
},{
    timestamps: false,
    freezeTableName: true
});

// Relasi dari model GrupUser
User.belongsTo(GrupUser, { 
    foreignKey: 'id_grup_user'
});

// Relasi dari model JenisKelamin
User.belongsTo(JenisKelamin, { 
    foreignKey: 'id_jenis_kelamin'
});

// Relasi dari model Sekolah
User.belongsTo(Sekolah, { 
    foreignKey: 'id_sekolah'
});

// Relasi ke model Pendaftaran
User.hasMany(db.models.pendaftaran || db.define('pendaftaran'), {
    foreignKey: 'id_user'
});

export default User;