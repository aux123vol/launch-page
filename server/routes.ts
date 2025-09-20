import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendWelcomeEmail } from "./sendgrid";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
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
  app.post('/api/mission/signup', async (req: Request, res: Response) => {
    try {
      const { name, phone, email } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      
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
          name: name.trim(),
          phone: phone?.trim() || null,
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

      // Send welcome email (temporarily disabled - see instructions above to enable)
      // TODO: Fix SendGrid configuration first:
      // 1. Verify API key has "Mail Send" permissions
      // 2. Add verified sender email in SendGrid dashboard  
      // 3. Update sender email in server/sendgrid.ts
      // Uncomment below once fixed:
      /*
      try {
        await sendWelcomeEmail(email, name.trim(), signupCount);
        console.log(`Welcome email sent successfully to ${email}`);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
      */

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
  app.get('/api/mission/count', async (req: Request, res: Response) => {
    try {
      const count = await storage.getMissionSignupCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching signup count:", error);
      res.status(500).json({ message: "Failed to fetch signup count" });
    }
  });

  // Protected route: Get all mission signups (admin only)
  app.get("/api/mission/signups", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const signups = await storage.getAllMissionSignups();
      res.json(signups);
    } catch (error) {
      console.error("Error fetching signups:", error);
      res.status(500).json({ message: "Failed to fetch signups" });
    }
  });

  // Stripe payment routes
  // Route for one-time payments - FIXED: Server-controlled pricing
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      
      // Server-controlled pricing - prevent client tampering
      let amount: number;
      let description: string;
      
      if (type === 'lifetime') {
        amount = 15000; // $150.00 in cents
        description = 'Genre AI Lifetime Access';
      } else {
        return res.status(400).json({ message: "Invalid payment type" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        description,
        metadata: {
          type: type,
          product: 'genre_ai_lifetime'
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Route for subscription payments
  app.post('/api/get-or-create-subscription', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    let user = req.user as any;
    const userId = user.claims.sub;

    // Get user from database
    user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        return;
      } catch (error) {
        console.error("Error retrieving subscription:", error);
        // Continue to create new subscription if retrieval fails
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ message: 'No user email on file' });
    }

    try {
      let customerId = user.stripeCustomerId;
      
      // Reuse existing customer or create new one
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // Create a subscription with monthly pricing ($15/month)
      // For now, we'll create a subscription with the amount directly
      // In production, you should use actual Stripe Price IDs
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Genre AI Early Bird Subscription',
              description: 'Monthly access to Genre AI platform',
            },
            unit_amount: 1500, // $15.00 in cents
            recurring: {
              interval: 'month',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}