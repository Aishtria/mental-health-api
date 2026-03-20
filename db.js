import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  // ⚡ FIX 1: Ensure port is a Number
  port: Number(process.env.MYSQLPORT) || 32465, 
  waitForConnections: true,
  connectionLimit: 10,
  // ⚡ FIX 2: Explicit SSL configuration for Railway
  ssl: {
    rejectUnauthorized: false
  }
});

// Check connection status
db.getConnection()
  .then((connection) => {
    console.log("✅ SUCCESS: Linked to Railway MySQL!");
    connection.release(); // Always release the connection
  })
  .catch((err) => {
    // ⚡ FIX 3: Print the FULL error so we can see why it's failing
    console.error("❌ Database connection error:", err);
  });

export default db;