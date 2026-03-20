import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
    try {
        // 🚨 We use the EXACT names from your Render Environment Variables
        const connection = await mysql.createConnection({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQLPASSWORD,
            database: process.env.MYSQLDATABASE,
            port: process.env.MYSQLPORT || 32465,
            // ✨ Crucial: Railway often needs SSL for external connections
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log("✅ SUCCESS: The bridge to Railway is OPEN!");
        
        // Let's check if the mood_entries table exists
        const [rows] = await connection.query("SHOW TABLES LIKE 'mood_entries'");
        if (rows.length > 0) {
            console.log("📊 Table 'mood_entries' found and ready.");
        } else {
            console.log("⚠️ Table 'mood_entries' is missing! Run your CREATE TABLE SQL.");
        }

        await connection.end();
    } catch (err) {
        console.error("❌ CONNECTION FAILED:", err.message);
        console.log("\n💡 QUICK FIX TIPS:");
        console.log("1. Check if MYSQLHOST matches your Railway 'Public Networking' host.");
        console.log("2. Ensure your IP isn't blocked (though Railway is usually open).");
        console.log("3. Double-check that your MYSQLPASSWORD hasn't expired.");
    }
}

testConnection();