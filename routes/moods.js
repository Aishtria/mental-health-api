import express from "express";
import { getAIResponse } from "./aiService.js"; // ✅ Import your new Gemini function
import db from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { full_name, mood_text } = req.body;

    if (!mood_text) {
      return res.status(400).json({ error: "Please tell me how you feel!" });
    }

    // 1. Get the response from Gemini
    const aiMessage = await getAIResponse(mood_text);

    // 2. Save to your March 20 Railway table
    const sql = `INSERT INTO mood_entries (user_id, mood_text, ai_response) VALUES (?, ?, ?)`;
    await db.query(sql, [1, mood_text, aiMessage]);

    console.log("✅ Gemini response saved to Railway!");

    res.status(201).json({ 
      success: true, 
      aiMessage: aiMessage 
    });

  } catch (error) {
    console.error("❌ Sync Error:", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

export default router;