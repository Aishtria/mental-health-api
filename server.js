import 'dotenv/config';
import express from 'express';
import db from './db.js'; // Note the .js extension is REQUIRED in ES Modules

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.get('/test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: "Database is alive!", result: rows[0].result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});