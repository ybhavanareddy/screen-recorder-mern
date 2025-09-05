import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const { DATABASE_URL, SQLITE_STORAGE } = process.env;

let sequelize;
if (DATABASE_URL) {
  // Postgres (Render / production)
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false
  });
} else {
  // SQLite (local dev)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: SQLITE_STORAGE || './data.sqlite',
    logging: false
  });
}

export default sequelize;
