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

// 3. TEST CONNECTION & ONE-TIME CLEANUP
pool.getConnection()
  .then(async (conn) => {
    console.log('✅ Connected to Railway MySQL database!');
    
    try {
      // THIS CLEARS THE OLD MESSY DATA AUTOMATICALLY ON STARTUP
      await conn.query("TRUNCATE TABLE mood_entries;");
      await conn.query("TRUNCATE TABLE users;");
      console.log("🧹 DATABASE CLEANED: Old messy data removed.");

      // Ensure ID is auto-incrementing
      await conn.query("ALTER TABLE mood_entries MODIFY COLUMN id INT AUTO_INCREMENT;");
      console.log("🛠️  AUTO-INCREMENT: Verified and active.");
    } catch (err) {
      console.log("ℹ️ Startup Task Note:", err.message);
    }

    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
  });

// 4. FIXED POST ROUTE
app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text } = req.body;

  // This ensures the note is what the AI "says"
  const ai_note = `I see you are feeling ${mood_text}, ${full_name}. I'm here for you!`;

  console.log(`📡 Processing: Name=${full_name}, Mood=${mood_text}`);

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and mood text are required." });
  }

  try {
    // A. Insert into 'users' table (Handles the Name/Email)
    await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email || `${full_name.replace(/\s+/g, '').toLowerCase()}@test.com`]
    );

    // B. Insert into 'mood_entries' table (Handles Mood/AI Note)
    // mood column gets "Happy", note column gets "I see you are feeling..."
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [mood_text, ai_note] 
    );

    console.log("✅ Success! Mood stored in mood_entries, User stored in users.");

    res.status(200).json({ 
      success: true, 
      ai_message: ai_note 
    });

  } catch (err) {
    console.error("❌ DATABASE INSERT ERROR:", err.sqlMessage || err.message);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.sqlMessage || err.message 
    });
  }
});

// 5. HEALTH CHECK
app.get('/', (req, res) => res.send('Mental Health API is Live and Healthy'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 API Server is running on port ${PORT}`);
});