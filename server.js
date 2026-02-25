import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

// 1. CORS Setup
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. DATABASE POOL
// Using the details provided: host, user, password, database, and port 32465
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 32465,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 
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
  // Destructure from req.body (matches your MoodForm.vue request)
  const { full_name, mood_text } = req.body;

  console.log(`📡 Attempting to save: Name: ${full_name}, Mood: ${mood_text}`);

  // Basic validation to prevent 500 errors from empty strings
  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and mood text are required." });
  }

  try {
    // We map your variables to your table columns:
    // full_name -> mood
    // mood_text -> note
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [full_name, mood_text]
    );

    console.log("✅ Database Success! Row ID:", result.insertId);

    res.status(200).json({ 
      success: true, 
      ai_message: `Thanks ${full_name}, your mood has been recorded in our database!` 
    });
  } catch (err) {
    // This will now print the EXACT reason for the 500 error in your Render logs
    console.error("❌ DATABASE INSERT ERROR:", err.sqlMessage || err.message);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.sqlMessage || err.message 
    });
  }
});

// 5. HEALTH CHECK
app.get('/', (req, res) => res.send('Mental Health API is Live and Healthy'));

const PORT = process.env.PORT || 10000; // Render uses 10000
app.listen(PORT, () => {
  console.log(`🚀 API Server is running on port ${PORT}`);
});