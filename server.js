import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// FIX 1: Open CORS completely to stop "Access Denied" errors from the browser
app.use(cors());
app.use(express.json());

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false } // Required for Railway/Render handshake
});

// Test Connection on Startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected and ready!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

// The Main Endpoint
app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date();

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and Mood are required." });
  }

  try {
    // FIX 2: INSERT IGNORE prevents errors if the email already exists in your 'users' table
    await pool.query(
      'INSERT IGNORE INTO users (full_name, email, created_at) VALUES (?, ?, ?)',
      [full_name, email || `${full_name.replace(/\s+/g, '').toLowerCase()}@test.com`, now]
    );

    // FIX 3: Matches your Railway columns exactly (full_name, mood, note)
    const [result] = await pool.query(
      'INSERT INTO mood_entries (full_name, mood, note, created_at) VALUES (?, ?, ?, ?)', 
      [full_name, mood_text, ai_note || '', now]
    );

    console.log(`✅ Success! Data saved for: ${full_name}`);
    res.status(200).json({ success: true, id: result.insertId });

  } catch (err) {
    // This logs the SPECIFIC SQL error in your Render dashboard
    console.error("❌ DATABASE ERROR:", err.sqlMessage || err.message);
    res.status(500).json({ 
      error: "Database failure", 
      details: err.sqlMessage || err.message 
    });
  }
});

// Basic health check for Render
app.get('/', (req, res) => {
  res.send('Mental Health API is running...');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});