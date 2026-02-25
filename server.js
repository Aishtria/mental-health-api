// 4. FIXED POST ROUTE
app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text } = req.body;

  // The AI's supportive message
  const ai_note = `I see you are feeling ${mood_text}, ${full_name}. I'm here for you!`;

  console.log(`📡 Correcting Data: Name (${full_name}) -> users | Feeling (${mood_text}) -> mood_entries`);

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and mood text are required." });
  }

  try {
    // A. Put Name and Email into 'users' table
    await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email || `${full_name.replace(/\s+/g, '').toLowerCase()}@test.com`]
    );

    // B. THE FIX: Put 'mood_text' (Happy) into 'mood' column 
    // and 'ai_note' (The AI message) into 'note' column
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [mood_text, ai_note]  // <--- This was the swapped part!
    );

    console.log("✅ Data mapped correctly! Mood ID:", result.insertId);

    res.status(200).json({ 
      success: true, 
      ai_message: ai_note 
    });

  } catch (err) {
    console.error("❌ DATABASE INSERT ERROR:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});