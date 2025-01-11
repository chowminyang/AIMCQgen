import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";

// Authentication password
const APP_PASSWORD = "mcq123"; // Simple development password

// Login schema validation
const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authToken = req.headers.authorization?.split(" ")[1];

  if (!authToken || authToken !== "mcq-token") {
    return res.status(401).json({ message: "Unauthorized access" });
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

      res.json({
        message: "Login successful",
        token: "mcq-token",
        user: { id: 1 }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // User info endpoint
  app.get("/api/user", requireAuth, (req, res) => {
    res.json({ id: 1 });
  });

  // Logout endpoint
  app.post("/api/logout", (_req, res) => {
    res.json({ message: "Logout successful" });
  });
}