// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// 1. CORS Setup - Allows your GitHub Pages to talk to Render
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 2. MySQL Connection Pool
// It will look for DB_PORT (32465) from your Render Environment Variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 32465, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000 
});

// 3. Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL database!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

// 4. The Mood Submission Route
app.post('/mood', async (req, res) => {
  // Pull data from Vue frontend
  const { full_name, mood_text } = req.body;
  
  console.log(`Incoming Data -> Name: ${full_name}, Mood: ${mood_text}`);

  try {
    // Insert into Railway table columns: mood, note
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [full_name, mood_text]
    );
    
    console.log("✅ Row inserted successfully!");

    res.json({ 
      success: true, 
      ai_message: `Thanks ${full_name}, your mood has been recorded!` 
    });
  } catch (err) {
    console.error("❌ Database Insert Error:", err.message);
    res.status(500).json({ 
      error: 'Database insert failed', 
      details: err.message 
    });
  }
});

// 5. Root route for health check
app.get('/', (req, res) => {
  res.send('Mental Health API is online and healthy!');
});

// Use Render's default port or 5000 for local testing
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API Server is running on port ${PORT}`);
});