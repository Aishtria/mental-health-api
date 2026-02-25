import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 32465,
});

app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date(); // Captures the current timestamp

  try {
    // 1. SAVE TO 'users' TABLE (name, email, created_at)
    // We use ON DUPLICATE KEY UPDATE so it doesn't error if the same user posts twice
    await pool.query(
      'INSERT INTO users (name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
      [full_name, email || 'test@test.com', now]
    );

    // 2. SAVE TO 'mood_entries' TABLE (mood, note, created_at)
    // 'mood' gets the user's feeling, 'note' gets the AI's response
    await pool.query(
      'INSERT INTO mood_entries (mood, note, created_at) VALUES (?, ?, ?)', 
      [mood_text, ai_note, now]
    );

    console.log(`✅ Success! Data for ${full_name} stored in both tables.`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ DATABASE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Backend Live on port ${PORT}`));