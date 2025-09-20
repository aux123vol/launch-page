import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendWelcomeEmail } from "./sendgrid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mission signup routes
  app.post('/api/mission/signup', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      // Check if email already signed up
      const existingSignup = await storage.getMissionSignupByEmail(email);
      if (existingSignup) {
        return res.status(409).json({ 
          message: "Email already signed up",
          signupCount: await storage.getMissionSignupCount()
        });
      }

      // Get user ID if logged in
      const userId = req.isAuthenticated() ? (req.user as any)?.claims?.sub : null;

      // Create mission signup
      let signup;
      try {
        signup = await storage.createMissionSignup({
          email,
          userId,
          isNewsletterSubscribed: true,
          signupSource: "website"
        });
      } catch (error: any) {
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
          return res.status(409).json({ 
            message: "Email already signed up",
            signupCount: await storage.getMissionSignupCount()
          });
        }
        throw error;
      }

      // Get updated count
      const signupCount = await storage.getMissionSignupCount();

      // Send welcome email
      try {
        await sendWelcomeEmail(email, signupCount);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the signup if email fails
      }

      res.json({
        message: "Successfully joined the mission!",
        signupCount,
        signupId: signup.id
      });

    } catch (error) {
      console.error("Mission signup error:", error);
      res.status(500).json({ message: "Failed to join mission" });
    }
  });

  // Get mission signup count (public endpoint)
  app.get('/api/mission/count', async (req, res) => {
    try {
      const count = await storage.getMissionSignupCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching signup count:", error);
      res.status(500).json({ message: "Failed to fetch signup count" });
    }
  });

  // Protected route: Get all mission signups (admin only)
  app.get("/api/mission/signups", isAuthenticated, async (req, res) => {
    try {
      const signups = await storage.getAllMissionSignups();
      res.json(signups);
    } catch (error) {
      console.error("Error fetching signups:", error);
      res.status(500).json({ message: "Failed to fetch signups" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}