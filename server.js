// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// Use a more robust CORS setup to ensure GitHub Pages can always talk to Render
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Create MySQL connection pool with Railway settings
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // Uses the variable or defaults to 3306
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds timeout for slower connections
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to Railway MySQL database!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

// The main POST route for your MoodForm
app.post('/mood', async (req, res) => {
  // These names (full_name, mood_text) come from your Vue App
  const { full_name, mood_text } = req.body;
  
  console.log(`Received submission from: ${full_name}`);

  try {
    // We map 'full_name' to 'mood' column and 'mood_text' to 'note' column
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [full_name, mood_text]
    );
    
    console.log("✅ Data successfully inserted into Railway!");

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

// Root route to check if server is awake
app.get('/', (req, res) => {
  res.send('Mental Health API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});