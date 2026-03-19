import express from "express";
import { db } from "../db.js"; 
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();

// --- NEW: GET Route ---
// Now you can visit /api/moods in your browser to see your data!
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM mood_entries ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("❌ Database Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

// --- POST Route (Your existing logic) ---
router.post("/", async (req, res) => {
  const { user_id, mood_text } = req.body;

  if (!mood_text) {
    return res.status(400).json({ error: "Mood text is required" });
  }

  try {
    // 1. Get AI feedback from Gemini
    const aiMessage = await getAIResponse(mood_text);

    // 2. Save to MySQL (Railway)
    const [result] = await db.execute(
      "INSERT INTO mood_entries (user_id, mood_text, ai_response) VALUES (?, ?, ?)",
      [user_id || 1, mood_text, aiMessage]
    );

    // 3. Return response to Vue frontend
    res.status(201).json({
      success: true,
      id: result.insertId,
      aiMessage: aiMessage
    });
  } catch (error) {
    console.error("❌ Database/AI Error:", error);
    res.status(500).json({ error: "Failed to process mood entry: " + error.message });
  }
});

export default router;