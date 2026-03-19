import express from "express";
import { db } from "../db.js"; 
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();

// Handles POST requests to https://mental-health-api-5gvy.onrender.com/api/moods
router.post("/", async (req, res) => {
  const { user_id, mood_text } = req.body;

  if (!mood_text) {
    return res.status(400).json({ error: "Mood text is required" });
  }

  try {
    // 1. Get AI feedback from Gemini
    const aiMessage = await getAIResponse(mood_text);

    // 2. Save to MySQL (Railway)
    // We use [result] to destructure the mysql2 promise response
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