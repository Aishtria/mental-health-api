import express from "express";
import { db } from "../db.js";
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { user_id, mood_text } = req.body; // These must match the Vue file!

  try {
    // 1. Get the AI Response first
    const aiMessage = await getAIResponse(mood_text);

    // 2. Insert into your MySQL database
    // Make sure your table 'mood_entries' has these exact columns
    const [result] = await db.execute(
      "INSERT INTO mood_entries (user_id, mood_text, ai_response) VALUES (?, ?, ?)",
      [user_id, mood_text, aiMessage]
    );

    // 3. Send everything back to the Frontend
    res.status(201).json({
      success: true,
      id: result.insertId,
      aiMessage: aiMessage
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Failed to save mood" });
  }
});

export default router;