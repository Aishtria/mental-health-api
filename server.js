import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from "groq-sdk";
import db from './db.js'; // Ensure this filename matches your database file

const app = express();

// 🚨 CRITICAL: These two lines fix the 400 "Bad Request" error
app.use(cors());
app.use(express.json()); 

const PORT = process.env.PORT || 10000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * 🔍 ROUTE 1: GET /mood-history
 * Fixes the 404 error by providing the exact endpoint the Vue app expects.
 */
app.get('/mood-history', async (req, res) => {
    try {
        console.log("📥 Fetching history from database...");
        // Adjust column names if your table uses 'mood' instead of 'mood_text'
        const [rows] = await db.query(
            'SELECT mood_text, ai_response, created_at FROM mood_entries ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("❌ DB Fetch Error:", err.message);
        res.status(500).json({ error: "Database fetch failed", details: err.message });
    }
});

/**
 * 🚀 ROUTE 2: POST /mood
 * Fixes the 400 error by correctly destructuring 'name' and 'mood'.
 */
app.post('/mood', async (req, res) => {
    const { name, mood } = req.body;

    console.log("📨 Received Payload:", { name, mood });

    // Validation to prevent the 400 error you saw
    if (!name || !mood) {
        return res.status(400).json({ error: "Name and Mood are required." });
    }

    try {
        // 🤖 AI Processing
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are a supportive mental health companion. Provide a short, empathetic one-sentence response." 
                },
                { role: "user", content: mood }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const aiReply = chatCompletion.choices[0].message.content;

        // 💾 Save to Database (Railway)
        const sql = `INSERT INTO mood_entries (user_id, mood_text, ai_response) VALUES (?, ?, ?)`;
        await db.query(sql, [1, mood, aiReply]); // Using 1 as a placeholder user_id

        // 📤 Send response back to Vue
        res.json({ 
            success: true, 
            ai_reply: aiReply 
        });

    } catch (err) {
        console.error("❌ AI/DB Error:", err.message);
        res.status(500).json({ error: "Processing failed", details: err.message });
    }
});

// Health check for Render
app.get('/health', (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Local Test: http://localhost:${PORT}/health`);
});