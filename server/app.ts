import express from "express";
import { registerRoutes } from "./routes";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for API requests
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files (keep the current Python server for now)
app.use(express.static('.'));

async function startServer() {
  try {
    const server = await registerRoutes(app);
    const PORT = process.env.PORT || 3001; // Use 3001 to not conflict with Python server
    
    server.listen(PORT, () => {
      console.log(`Backend API server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} for the API`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();