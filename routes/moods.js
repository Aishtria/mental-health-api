import express from "express";
import { getAIResponse } from "../services/aiService.js";
import { db } from "../db.js";

const router = express.Router();

router.post("/moods", async (req, res) => {
  try {
    const { full_name, user_id, mood_text } = req.body;

    // Save to DB
    await db.query(
      "INSERT INTO moods (full_name, user_id, mood_text) VALUES (?, ?, ?)",
      [full_name, user_id, mood_text]
    );

    // Get AI response
    const aiMessage = await getAIResponse(mood_text);

    res.status(201).json({ message: "Mood recorded", aiMessage });
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;