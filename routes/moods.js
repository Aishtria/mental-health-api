import express from "express";
import { db } from "../db.js"; 
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();

/**
 * GET /api/moods
 * This allows you to view all saved moods in your browser.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM mood_entries ORDER BY id DESC");
    res.json(rows); 
  } catch (error) {
    console.error("❌ Database Fetch Error:", error);
    res.status(500).json({ error: "Could not fetch moods: " + error.message });
  }
});

/**
 * POST /api/moods
 * This receives the mood from your Vue app, gets AI feedback, and saves to the DB.
 */
router.post("/", async (req, res) => {
  const { user_id, mood_text } = req.body;

  // Validation
  if (!mood_text) {
    return res.status(400).json({ error: "Mood text is required" });
  }

  try {
    // 1. Get AI feedback from your Gemini service
    const aiMessage = await getAIResponse(mood_text);

    // 2. Save the entry to your Railway MySQL database
    // Note: We use user_id || 1 to default to 1 if no user is logged in
    const [result] = await db.execute(
      "INSERT INTO mood_entries (user_id, mood_text, ai_response) VALUES (?, ?, ?)",
      [user_id || 1, mood_text, aiMessage]
    );

    // 3. Send the success response back to Vue
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