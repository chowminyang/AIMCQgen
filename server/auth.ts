import type { Express } from "express";
import { z } from "zod";

const FIXED_PASSWORD = "CMYMCQ";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export function setupAuth(app: Express) {
  app.post("/api/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ") });
      }

      const { password } = result.data;

      if (password.toUpperCase() !== FIXED_PASSWORD) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Return success with a token
      res.json({
        message: "Login successful",
        user: { id: 1 },
        token: 'authenticated'
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/logout", (_req, res) => {
    res.json({ message: "Logout successful" });
  });

  app.get("/api/user", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== 'authenticated') {
      return res.status(401).json({ message: "Not logged in" });
    }
    res.json({ id: 1 });
  });
}