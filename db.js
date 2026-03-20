import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  // Ensure port is a number, default to Railway's public port
  port: parseInt(process.env.MYSQLPORT) || 32465,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection immediately
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ SUCCESS: Linked to Railway MySQL!");
    connection.release();
  } catch (err) {
    // This will now print the FULL error details in Render logs
    console.error("❌ Database connection error details:", {
      message: err.message,
      code: err.code,
      errno: err.errno,
      host: process.env.MYSQLHOST
    });
  }
})();

export default db;