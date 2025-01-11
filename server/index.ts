import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import session from "express-session";
import createMemoryStore from "memorystore";

const app = express();

// Setup CORS for development first
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Credentials', 'true');
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Setup session middleware
const MemoryStore = createMemoryStore(session);
app.use(session({
  secret: process.env.REPL_ID || "mcq-session-secret",
  name: 'mcq.sid', // Set a specific cookie name
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Set to true only in production with HTTPS
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  console.log('Session:', {
    id: req.sessionID,
    authenticated: req.session.authenticated,
    userId: req.session.userId,
    cookie: req.session.cookie
  });

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

//Setup authentication
// Register routes
// Error handling middleware
// Setup vite in development
// Start server

(async () => {
  try {
    // Setup authentication
    setupAuth(app);
    log("Authentication setup complete");

    // Register routes
    const server = registerRoutes(app);
    log("Routes registered");

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup vite in development
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite setup complete");
    } else {
      serveStatic(app);
      log("Static serving setup complete");
    }

    // Start server
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();