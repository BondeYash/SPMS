import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "production_db",
    synchronize: true, // Set to false in production and use migrations
    logging: false,
    entities: ["src/entities/**/*.ts"],
    subscribers: [],
    migrations: ["src/migrations/**/*.ts"],
});
