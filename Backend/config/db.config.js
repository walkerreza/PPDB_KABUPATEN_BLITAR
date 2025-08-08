import { Sequelize } from "sequelize";
const db = new Sequelize('PPDB', 'postgres', 'admin', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432
})

export default db;