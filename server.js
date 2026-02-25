import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 32465,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB Connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL');
    conn.release();
  })
  .catch(err => console.error('❌ MySQL Error:', err.message));

// THE ROUTE THAT MATCHES YOUR VUE FORM
app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and mood are required." });
  }

  try {
    // 1. Fill users table
    await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email || 'user@test.com']
    );

    // 2. Fill mood_entries table correctly
    await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [mood_text, ai_note || 'Feeling recorded']
    );

    console.log(`✅ Success for ${full_name}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ DB ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('API is Online'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));