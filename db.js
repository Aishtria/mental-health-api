import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  // 🚨 Port 32465 is from your credentials, let's make sure it uses it
  port: process.env.MYSQLPORT || 32465, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ✨ ADDED: SSL is often required for Railway to talk to Render safely
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ Added a test to "shout" in the logs when it works!
db.getConnection()
  .then(() => console.log("✅ SUCCESS: Linked to Railway MySQL!"))
  .catch((err) => console.error("❌ CONNECTION ERROR:", err.message));

export default db;