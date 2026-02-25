import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// 1. IMPROVED CORS: Handles preflight and specific origins
app.use(cors({
  origin: '*', // Allows all origins for testing; change to your GitHub URL once confirmed working
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Required for many cloud MySQL providers like Railway
  }
});

// 3. Test Connection on Startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err.message);
  });

// 4. The FIXED Mood Route
app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date();

  // Safety Check
  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Missing required fields: full_name or mood_text" });
  }

  try {
    // INSERT/UPDATE User
    await pool.query(
      'INSERT INTO users (full_name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
      [full_name, email, now]
    );

    // INSERT Mood Entry (Now includes full_name so it's not empty!)
    // Ensure your table has columns: full_name, mood, note, created_at
    await pool.query(
      'INSERT INTO mood_entries (full_name, mood, note, created_at) VALUES (?, ?, ?, ?)', 
      [full_name, mood_text, ai_note, now]
    );

    console.log(`✅ Data saved for ${full_name}`);
    res.status(200).json({ success: true, message: "Entry saved!" });

  } catch (err) {
    console.error("❌ SQL ERROR:", err.message);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message 
    });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});