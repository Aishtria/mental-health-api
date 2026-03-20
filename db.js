import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  // We use the EXACT keys from your Railway screenshot
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE, // Ensure this matches Railway
  port: Number(process.env.MYSQLPORT) || 3306, // Changed to 3306 to match your screen
  ssl: {
    rejectUnauthorized: false
  }
});

// Deep diagnostic for Lab 7
db.getConnection()
  .then(() => console.log("✅ SUCCESS: The Bridge to Railway is Active!"))
  .catch((err) => {
    console.error("❌ DATABASE ERROR CODE:", err.code);
    console.error("❌ DATABASE ERROR MESSAGE:", err.message);
  });

export default db;