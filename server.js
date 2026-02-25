import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// Enable CORS for your GitHub Pages URL
app.use(cors({
  origin: 'https://aishtria.github.io',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
});

// Route to save mood
app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date();

  try {
    // 1. Save to users
    await pool.query(
      'INSERT INTO users (name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email, now]
    );

    // 2. Save to mood_entries
    await pool.query(
      'INSERT INTO mood_entries (mood, note, created_at) VALUES (?, ?, ?)', 
      [mood_text, ai_note, now]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ SQL Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));