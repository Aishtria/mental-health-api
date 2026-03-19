import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log("✅ Successfully connected to Railway!");
        await connection.end();
    } catch (err) {
        console.error("❌ Connection failed:", err.message);
        console.error("Error Detail:", err.code);
    }
}

testConnection();