// server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// 1. IMPROVED CORS: Allows GitHub Pages to talk to your API
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. DATABASE POOL
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

// 3. TEST CONNECTION
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL database!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

// 4. POST ROUTE
app.post('/mood', async (req, res) => {
  const { full_name, mood_text } = req.body;
  console.log(`Incoming Data -> Name: ${full_name}, Mood: ${mood_text}`);

  try {
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [full_name, mood_text]
    );
    console.log("✅ Row inserted successfully!");
    res.status(200).json({ 
      success: true, 
      ai_message: `Thanks ${full_name}, your mood has been recorded!` 
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5. HEALTH CHECK
app.get('/', (req, res) => res.send('API is Live and Healthy'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});