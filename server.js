import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// Enable CORS for your GitHub Pages
app.use(cors({
  origin: ['https://aishtria.github.io', 'http://localhost:5173'],
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
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// TEST CONNECTION IMMEDIATELY
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err.message);
  });

app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date();

  try {
    // 1. Save to 'users' table
    await pool.query(
      'INSERT INTO users (name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email, now]
    );

    // 2. Save to 'mood_entries' table 
    // IMPORTANT: Added 'name' (or 'full_name') to the columns so the DB knows whose mood it is
    await pool.query(
      'INSERT INTO mood_entries (full_name, mood, note, created_at) VALUES (?, ?, ?, ?)', 
      [full_name, mood_text, ai_note, now]
    );

    console.log(`✅ Success for ${full_name}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ SQL ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));