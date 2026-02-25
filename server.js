// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
// UPDATED: Added explicit CORS for your GitHub Pages
app.use(cors()); 
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306, // ALWAYS add the port for Railway
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
  });

app.post('/mood', async (req, res) => {
  const { full_name, mood_text } = req.body;
  
  try {
    // UPDATED: Changed column names to match your Railway table (mood, note)
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [full_name, mood_text]
    );
    
    res.json({ 
      success: true, 
      ai_message: `Thanks ${full_name}, your mood has been recorded!` 
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: 'Database insert failed', details: err.message });
  }
});

// Render provides the PORT automatically
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});