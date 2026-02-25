import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// 1. CORS - Set to '*' for maximum compatibility during testing
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Ensure DB_PORT is being read correctly
  port: parseInt(process.env.DB_PORT) || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false // This is MANDATORY for Railway
  }
});

// 3. Test Connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected and ready!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

// 4. The Automatic Mood Route
app.post('/mood', async (req, res) => {
  // Destructure variables from the request body sent by your website
  const { full_name, email, mood_text, ai_note } = req.body;
  const now = new Date();

  // Basic validation
  if (!full_name || !mood_text) {
    console.log("⚠️ Blocked: Missing data in request body");
    return res.status(400).json({ error: "Name and Mood are required." });
  }

  try {
    // A. Sync User Table
    await pool.query(
      'INSERT INTO users (full_name, email, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)',
      [full_name, email || 'no-email@test.com', now]
    );

    // B. Insert Mood Entry (Matches your successful manual test!)
    const [result] = await pool.query(
      'INSERT INTO mood_entries (full_name, mood, note, created_at) VALUES (?, ?, ?, ?)', 
      [full_name, mood_text, ai_note || '', now]
    );

    console.log(`✅ Success! New Row ID: ${result.insertId} for ${full_name}`);
    
    res.status(200).json({ 
      success: true, 
      message: `Entry saved for ${full_name}`,
      id: result.insertId 
    });

  } catch (err) {
    console.error("❌ SQL ERROR:", err.sqlMessage || err.message);
    res.status(500).json({ 
      error: "Database insertion failed", 
      details: err.sqlMessage || err.message 
    });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});