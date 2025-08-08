import { Sequelize } from "sequelize";
import db from "../config/db.config.js";
import User from "./user.model.js";

const { DataTypes } = Sequelize;
const SessionUser = db.define("session_user", {
    id_session_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id_user'
        }
    },
    session_expired: {
        type: 'TIMESTAMP',
        allowNull: false
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    timestamps: false,
    freezeTableName: true
});

// Relasi
SessionUser.belongsTo(User, { 
    foreignKey: 'id_user'
});

export default SessionUser;