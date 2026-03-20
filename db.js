import mysql from 'mysql2/promise';
import 'dotenv/config';

// 🔍 LAB 7 LOGGING: Trace the variables being used
console.log("📡 Connecting to Host:", process.env.MYSQLHOST);
console.log("🔌 Using Port:", process.env.MYSQLPORT || 3306);

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  // This logic tries the Env Port first, then falls back to 3306
  port: Number(process.env.MYSQLPORT) || 3306, 
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 10000 // 10 seconds timeout
});

// 🧪 LAB 7 DIAGNOSTIC: Test connection without crashing the app
async function testDB() {
  try {
    const connection = await db.getConnection();
    console.log("✅ SUCCESS: Database Handshake Complete!");
    connection.release();
  } catch (err) {
    console.error("❌ DATABASE CONNECTION ERROR:");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    console.log("💡 TIP: Check if Railway Public Networking is ENABLED.");
  }
}

testDB();

export default db;