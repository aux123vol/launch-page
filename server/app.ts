import express from "express";
import path from "path";
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

// Block access to sensitive files/directories first
app.use(['/server', '/shared', '/node_modules', '*.config.*', 'package*.json', '.env*'], (req, res) => {
  res.status(403).send('Forbidden');
});

// Serve static files (website only)
app.use(express.static('.', {
  index: ['index.html'],
  dotfiles: 'deny' // Block hidden files
}));

async function startServer() {
  try {
    const server = await registerRoutes(app);
    const PORT = process.env.PORT || 5000; // Use port 5000 for both website and API
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Genre server running on port ${PORT}`);
      console.log(`Website: http://0.0.0.0:${PORT}`);
      console.log(`API: http://0.0.0.0:${PORT}/api/*`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();