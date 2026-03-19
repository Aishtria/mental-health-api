import express from "express";
import cors from "cors";
import moodRoutes from "./routes/moods.js";

const app = express();

// Middleware
app.use(cors({
  origin: "https://aishtria.github.io", // Replace with your actual GitHub Pages URL
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// Routes
// This maps everything from the frontend's /api/moods to moodRoutes
app.use("/api/moods", moodRoutes); 

// Use Render's port and bind to 0.0.0.0 for external access
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});