// 4. POST ROUTE
app.post('/mood', async (req, res) => {
  // Destructure name, email, and mood from your frontend request
  const { full_name, email, mood_text } = req.body;

  // This is the message the AI would "say"
  const ai_advice = `I hear you, ${full_name}. Being ${mood_text} is completely valid.`;

  console.log(`📡 Processing entry for: ${full_name}`);

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and mood are required." });
  }

  try {
    // 1. Save the person's info to the 'users' table
    // We use "ON DUPLICATE KEY UPDATE" so it doesn't error if the email already exists
    await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [full_name, email || `${full_name.replace(/\s+/g, '').toLowerCase()}@example.com`]
    );

    // 2. Save the mood and the AI's response to 'mood_entries'
    // Now: 'mood' column gets "Happy", 'note' column gets the AI advice
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [mood_text, ai_advice]
    );

    console.log("✅ Data sorted: User saved and Mood logged!");

    res.status(200).json({ 
      success: true, 
      ai_message: ai_advice 
    });

  } catch (err) {
    console.error("❌ DATABASE ERROR:", err.sqlMessage || err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});