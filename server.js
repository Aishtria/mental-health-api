import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false }
});

// Test Connection Log
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected and ready!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date();

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and Mood are required." });
  }

  try {
    // 1. Sync User
    await pool.query(
      'INSERT INTO users (full_name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
      [full_name, email || 'no-email@test.com', now]
    );

    // 2. Insert Mood (Matches your 'DESCRIBE' columns: full_name, mood, note)
    const [result] = await pool.query(
      'INSERT INTO mood_entries (full_name, mood, note, created_at) VALUES (?, ?, ?, ?)', 
      [full_name, mood_text, ai_note || '', now]
    );

    console.log(`✅ Success for ${full_name}`);
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    console.error("❌ SQL ERROR:", err.message);
    res.status(500).json({ error: "Database failure", details: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});