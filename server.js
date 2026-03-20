import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from "groq-sdk";
import db from './db.js'; 

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

const PORT = process.env.PORT || 10000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * 🏠 Base Route
 */
app.get('/', (req, res) => {
    res.send("<h1>🧍 Mental Health API is online and Relational.</h1>");
});

/**
 * 🔍 GET /mood-history
 * Fetches moods with their linked user data
 */
app.get('/mood-history', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT full_name, mood_text, ai_response, created_at FROM mood_entries ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ error: "Database fetch failed", details: err.message });
    }
});

/**
 * 🚀 POST /moods
 * Detects User ID from 'users' table and saves mood
 */
app.post('/moods', async (req, res) => {
    const submittedName = req.body.full_name || req.body.name;
    const mood = req.body.mood_text || req.body.mood;

    if (!submittedName || !mood) {
        return res.status(400).json({ error: "Name and Mood are required." });
    }

    try {
        // --- 🔍 LAB 7 DETECTION LOGIC ---
        // Search for the user in the 'users' table based on the name from Vue
        const [userRows] = await db.query(
            "SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)", 
            [submittedName]
        );

        let finalUserId;
        if (userRows.length > 0) {
            finalUserId = userRows[0].id; // Found Trishia or Shane!
            console.log(`✅ User Detected: ${submittedName} (ID: ${finalUserId})`);
        } else {
            finalUserId = 1; // Default to ID 1 if name doesn't exist in users table
            console.log(`⚠️ User not found. Defaulting to ID 1.`);
        }
        // -------------------------------

        // AI Response Generation
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: `Give a supportive 1-sentence response to: ${mood}` }],
            model: "llama-3.3-70b-versatile",
        });
        const aiReply = chatCompletion.choices[0].message.content;

        // Save to mood_entries using the DETECTED User ID
        const sql = `INSERT INTO mood_entries (user_id, full_name, mood_text, ai_response) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [finalUserId, submittedName, mood, aiReply]); 

        res.json({ success: true, aiReply: aiReply });

    } catch (err) {
        console.error("❌ Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});