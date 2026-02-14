import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'production_db'
        });

        const [rows] = await connection.execute(
            `SHOW INDEX FROM production_entry WHERE Key_name = 'IDX_aba7ee6516e38cf752dcf799fc'`
        );

        const indexExists = (rows as any).length > 0;
        console.log(`Index IDX_aba7ee6516e38cf752dcf799fc exists: ${indexExists}`);

        // Also check if the table exists at all to be sure
        const [tables] = await connection.execute(`SHOW TABLES LIKE 'production_entry'`);
        if ((tables as any).length === 0) {
            console.log("Table production_entry does not exist!");
        }

        await connection.end();
    } catch (error) {
        console.error("Error connecting to DB:", error);
    }
}
check();
