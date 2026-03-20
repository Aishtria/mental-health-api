import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from "groq-sdk";
import db from './db.js'; 

const app = express();

app.use(cors());
app.use(express.json()); 

const PORT = process.env.PORT || 10000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Base Route
app.get('/', (req, res) => {
    res.send("<h1>🧍 Mental Health API is online.</h1>");
});

// POST /moods - Matches Vue call
app.post('/moods', async (req, res) => {
    const name = req.body.full_name || req.body.name;
    const mood = req.body.mood_text || req.body.mood;
    const userId = req.body.user_id || 1; // Default to 1 for Lab 7

    if (!name || !mood) {
        return res.status(400).json({ error: "Name and Mood are required." });
    }

    try {
        // AI Logic
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: `Give a short, supportive response to: ${mood}` }],
            model: "llama-3.3-70b-versatile",
        });
        const aiReply = chatCompletion.choices[0].message.content;

        // Save to Railway (Ensure columns match your mood_entries table)
        const sql = `INSERT INTO mood_entries (user_id, full_name, mood_text, ai_response) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [userId, name, mood, aiReply]); 

        // Send back as aiReply (matching Vue)
        res.json({ success: true, aiReply: aiReply });
    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});