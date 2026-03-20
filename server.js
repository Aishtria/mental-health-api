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

app.get('/', (req, res) => {
    res.send("<h1>🧍 Mental Health API: Auto-Registration Active.</h1>");
});

app.post('/moods', async (req, res) => {
    const submittedName = req.body.full_name || req.body.name;
    const mood = req.body.mood_text || req.body.mood;

    if (!submittedName || !mood) {
        return res.status(400).json({ error: "Name and Mood are required." });
    }

    try {
        // --- ✨ STEP 1: AUTO-DETECTION & REGISTRATION ---
        // Look for the user
        let [userRows] = await db.query("SELECT id FROM users WHERE LOWER(full_name) = LOWER(?)", [submittedName]);

        let finalUserId;

        if (userRows.length > 0) {
            // User exists! Use their ID.
            finalUserId = userRows[0].id;
            console.log(`✅ Existing User: ${submittedName} (ID: ${finalUserId})`);
        } else {
            // User is NEW! Automatically add them to the 'users' table.
            const tempEmail = `${submittedName.replace(/\s+/g, '').toLowerCase()}@example.com`;
            const [newUser] = await db.query(
                "INSERT INTO users (full_name, email) VALUES (?, ?)", 
                [submittedName, tempEmail]
            );
            finalUserId = newUser.insertId;
            console.log(`✨ New User Registered: ${submittedName} (ID: ${finalUserId})`);
        }

        // --- 🤖 STEP 2: AI RESPONSE ---
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: `Give a supportive 1-sentence response to: ${mood}` }],
            model: "llama-3.3-70b-versatile",
        });
        const aiReply = chatCompletion.choices[0].message.content;

        // --- 💾 STEP 3: SAVE MOOD LINKED TO USER ---
        const sql = `INSERT INTO mood_entries (user_id, full_name, mood_text, ai_response) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [finalUserId, submittedName, mood, aiReply]); 

        res.json({ success: true, aiReply: aiReply });

    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});