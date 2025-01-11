import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";

// Authentication password
const APP_PASSWORD = "mcq123"; // Simple development password

// Login schema validation
const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
    userId: number;
  }
}

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ message: "Please login first" });
  }
  next();
};

// Setup authentication routes
export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  app.use(session({
    secret: process.env.REPL_ID || "mcq-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ") 
        });
      }

      const { password } = result.data;
      if (password !== APP_PASSWORD) {
        return res.status(401).json({ message: "Invalid password" });
      }

      req.session.authenticated = true;
      req.session.userId = 1;

      res.json({
        message: "Login successful",
        user: { id: 1 }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // User info endpoint
  app.get("/api/user", requireAuth, (req, res) => {
    res.json({ id: req.session.userId });
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}