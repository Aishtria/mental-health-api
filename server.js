import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from "groq-sdk"; 
import db from './db.js';

const app = express();

// ✅ Middleware
// express.json() MUST be above the routes to parse incoming data
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ✅ Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ GET Route: Fetch all history for User #1
app.get('/mood-history', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT mood_text, ai_response, created_at FROM mood_entries WHERE user_id = 1 ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error("❌ Fetch Error:", err.message);
        res.status(500).json({ error: "Could not retrieve history", details: err.message });
    }
});

// ✅ POST Route: Saves to mood_entries
app.post('/mood', async (req, res) => {
    // We destructure name and mood_text from the Vue frontend
    const { name, mood_text } = req.body;

    // Validation: We check for mood_text since it's required for the DB
    if (!mood_text) {
        return res.status(400).json({ error: "Please describe your mood first!" });
    }

    try {
        console.log(`🤖 Processing mood for ${name || 'User'}...`);

        // 1. Generate Supportive Response using Groq AI
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a supportive mental health companion. Provide a one-sentence, empathetic response."
                },
                { role: "user", content: mood_text }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const aiReply = chatCompletion.choices[0].message.content;

        // 2. Insert into mood_entries table
        // We use user_id = 1 (linked to Trishia in your users table)
        const sql = `INSERT INTO mood_entries (user_id, mood_text, ai_response) VALUES (?, ?, ?)`;
        
        await db.query(sql, [1, mood_text, aiReply]);

        console.log("✅ Data successfully saved to Railway mood_entries!");

        // 3. Send back to Vue Frontend
        res.json({ 
            success: true, 
            ai_reply: aiReply 
        });

    } catch (err) {
        console.error("❌ BACKEND ERROR:", err.message);
        res.status(500).json({ 
            error: "Sync Failed", 
            details: err.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Version 4.3 online at port ${PORT}`);
});