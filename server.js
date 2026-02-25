app.post('/mood', async (req, res) => {
  const { full_name, email, mood_text, ai_note } = req.body;

  try {
    // This fills the 'users' table
    await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
      [full_name, email]
    );

    // This fills the 'mood_entries' table correctly
    await pool.query(
      'INSERT INTO mood_entries (mood, note) VALUES (?, ?)', 
      [mood_text, ai_note] 
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});