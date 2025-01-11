import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";

// Authentication password
const APP_PASSWORD = "CMYMCQ"; // Simple development password

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

      // Set session data
      req.session.authenticated = true;
      req.session.userId = 1;

      // Force session save and wait for it
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          resolve();
        });
      });

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
  app.get("/api/user", (req, res) => {
    if (req.session.authenticated) {
      return res.json({ id: req.session.userId });
    }
    res.status(401).json({ message: "Please login first" });
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('mcq.sid');
      res.json({ message: "Logout successful" });
    });
  });
}