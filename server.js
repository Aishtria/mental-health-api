// 4. POST ROUTE
app.post('/mood', async (req, res) => {
  // Destructure everything from the frontend request
  // Assuming your Vue app sends: full_name, email, mood_text
  const { full_name, email, mood_text } = req.body;

  // Simple AI logic to generate the 'note'
  const ai_advice = `That's wonderful, ${full_name}! Keep spreading positivity 😊`;

  console.log(`📡 Saving User: ${full_name} and Mood: ${mood_text}`);

  if (!full_name || !mood_text) {
    return res.status(400).json({ error: "Name and mood are required." });
  }

  try {
    // 1. Insert into 'users' table
    // We use IGNORE or ON DUPLICATE so it doesn't error if the user exists
    await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email || `${full_name}@example.com`]
    );

    // 2. Insert into 'mood_entries' table
    // mood = "Happy", note = "That's wonderful..."
    const [result] = await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [mood_text, ai_advice]
    );

    console.log("✅ Data sorted correctly! Mood ID:", result.insertId);

    res.status(200).json({ 
      success: true, 
      ai_message: ai_advice 
    });

  } catch (err) {
    console.error("❌ DATABASE ERROR:", err.sqlMessage || err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});