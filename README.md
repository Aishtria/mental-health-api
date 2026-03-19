# Mood Tracker AI API
A full-stack backend application that tracks user moods and provides AI-driven insights.

## 🚀 Features
- **Mood Logging**: Store daily entries in a MySQL database.
- **AI Analysis**: Integration with Google Gemini to analyze emotional trends.
- **RESTful API**: Clean Express.js routes for data management.

## 🛠️ Tech Stack
- **Node.js** & **Express**
- **MySQL** (Database)
- **Git** (Version Control)

## ⚙️ Local Setup
1. Clone the repo.
2. Run `npm install`.
3. Configure your `.env` file:
   ```
   DB_HOST=your_db_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   DB_PORT=3306
   GEMINI_API_KEY=your_gemini_key
   ```
4. Start the server: `npm start` or `npm run dev`.

## ☁️ Deploy to Render + Railway MySQL
1. Push to GitHub.
2. Connect Render to GitHub repo.
3. **Settings > Build Command**: `npm install`
4. **Settings > Start Command**: `npm start`
5. **Environment Variables** (from Railway dashboard):
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
   - `GEMINI_API_KEY`
   - `PORT` auto-set by Render.

**API Endpoint**: `https://your-app.onrender.com/api/moods` (POST)

**Test**: 
```bash
curl -X POST https://your-app.onrender.com/api/moods \\
  -H \"Content-Type: application/json\" \\
  -d '{\"full_name\":\"Test User\",\"user_id\":\"123\",\"mood_text\":\"Feeling great!\"}'
```

## 🗄️ Database Schema
```sql
CREATE TABLE moods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255),
  user_id VARCHAR(255),
  mood_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Troubleshooting
- 404 on /api/moods? Check start script in package.json.
- DB errors? Verify Railway env vars on Render.
- AI errors? Add GEMINI_API_KEY.
