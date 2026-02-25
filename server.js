import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// 1. Enable CORS
app.use(cors({
  origin: ['https://aishtria.github.io', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
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
  queueLimit: 0
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

  try {
    // FIX 1: Ensure column names match. (Using VALUES(full_name) handles the update)
    await pool.query(
      'INSERT INTO users (full_name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
      [full_name, email, now]
    );

    // FIX 2: Fixed the column-to-placeholder count (3 columns = 3 question marks)
    // NOTE: If you want to see WHO posted the mood in your table, 
    // you should add a 'full_name' column to your mood_entries table in Railway.
    await pool.query(
      'INSERT INTO mood_entries (mood, note, created_at) VALUES (?, ?, ?)', 
      [mood_text, ai_note, now]
    );

    console.log(`✅ Data saved for ${full_name}`);
    res.status(200).json({ success: true, message: "Entry saved!" });

  } catch (err) {
    // Logs the exact SQL error to your Railway/Terminal logs
    console.error("❌ SQL ERROR:", err.message);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message 
    });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));