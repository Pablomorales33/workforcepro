import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const PORT = 3000;

// Initialize the secure server-bound Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chat will operate in simulated offline mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Initialize secure server-bound Stripe client
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe | null {
  if (!stripeClient) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.warn("WARNING: STRIPE_SECRET_KEY environment variable is not set. Stripe will operate in simulated offline mode.");
    } else {
      stripeClient = new Stripe(stripeKey, {
        apiVersion: "2025-02-18-ac" as any, // Standard stable API version
      });
    }
  }
  return stripeClient;
}

async function startServer() {
  const app = express();

  // Stripe Webhook Endpoint (requires raw body before express.json() is applied)
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const stripe = getStripeClient();
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe) {
      res.status(400).send("Webhook ignored: Stripe is running in simulated mode");
      return;
    }
    if (!sig || !webhookSecret) {
      res.status(400).send("Webhook missing signature or configuration secret");
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    console.log(`[Stripe Webhook] Received event type: ${event.type}`);

    // Handle key SaaS subscription events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log(`Checkout session completed successfully: ${session.id}`);
        // Fulfill subscription details here (e.g., save customer/subscription status in DB)
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        console.log(`Subscription updated: ${sub.id} (Status: ${sub.status})`);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        console.log(`Subscription cancelled or ended: ${sub.id}`);
        break;
      }
      default:
        // Other events ignored
        break;
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // Stripe Checkout Session Endpoint
  app.post("/api/stripe/create-checkout-session", async (req: Request, res: Response) => {
    const { planId, billingCycle, origin } = req.body;

    const rootUrl = origin || "http://localhost:3000";
    const successUrl = `${rootUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}&plan=${planId}&cycle=${billingCycle}`;
    const cancelUrl = `${rootUrl}?payment=cancel&plan=${planId}`;

    const stripe = getStripeClient();
    if (!stripe) {
      // Offline/Simulated mode
      console.log(`[Stripe Simulator] Creating mock checkout session for plan: ${planId} (${billingCycle})`);
      const mockSessionUrl = `${rootUrl}?payment=success&session_id=mock_session_${Date.now()}&plan=${planId}&cycle=${billingCycle}`;
      // Simulate small delay
      setTimeout(() => {
        res.json({ url: mockSessionUrl, simulated: true });
      }, 800);
      return;
    }

    try {
      // Calculate payment amounts: Essentials ($2/month per employee), Plus ($4/month per employee)
      const unitAmount = planId === "starter" ? 200 : 400;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `WorkforcePro ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
                description: `SaaS Billing subscription - ${billingCycle === "annual" ? "Annual Billing (20% off)" : "Monthly Billing"}`,
              },
              unit_amount: unitAmount,
              recurring: {
                interval: billingCycle === "annual" ? "year" : "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      res.json({ url: session.url, simulated: false });
    } catch (error: any) {
      console.error("Stripe API Session Error:", error);
      res.status(500).json({ error: "Failed to create Stripe Checkout session", details: error.message });
    }
  });

  // Stripe Portal Session Endpoint (for customer billing self-service)
  app.post("/api/stripe/create-portal-session", async (req: Request, res: Response) => {
    const { origin } = req.body;
    const stripe = getStripeClient();
    if (!stripe) {
      console.log("[Stripe Simulator] Creating mock Customer Portal session redirection");
      res.json({ url: `${origin || "http://localhost:3000"}?portal=simulated`, simulated: true });
      return;
    }

    try {
      // Note: In production, retrieve the user's stripeCustomerId from your database
      // Here we check if there's an environment variable customer to test, or create a mock/placeholder
      const testCustomerId = process.env.STRIPE_TEST_CUSTOMER_ID || "cus_demo_placeholder";
      
      const session = await stripe.billingPortal.sessions.create({
        customer: testCustomerId,
        return_url: origin || "http://localhost:3000",
      });

      res.json({ url: session.url, simulated: false });
    } catch (error: any) {
      console.error("Stripe Portal Error:", error);
      res.status(500).json({ error: "Failed to create Customer Portal session", details: error.message });
    }
  });

  // API Check Endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  // Secure Gemini Chat Proxy for Workforce Conversations
  app.post("/api/chat", async (req: Request, res: Response) => {
    const { messages, recipient, recipientRole } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid messages format" });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback simulation mode if key is missing during initial draft
        let mockResponse = "Hey there! I am currently running in offline simulation mode. Please configure GEMINI_API_KEY under Secrets to get loaded live AI responses.";
        if (recipient === "Sarah") {
          mockResponse = "Hi Alex! Understood. I can review shift requests, but to get full intelligent responses, tell the developer to set the GEMINI_API_KEY in the Settings > Secrets panel.";
        }
        setTimeout(() => {
          res.json({ text: mockResponse });
        }, 1200);
        return;
      }

      const client = getGeminiClient();

      const characterContext = `
You are simulating a text messaging dialogue inside the 'WorkforcePro' workforce app. The current user is 'Alex', a reliable service employee at 'Wayback Bar & Grill'.
You are playing the role of: **${recipient}** (${recipientRole}).

Guidelines for your character:
- ${recipient === "Sarah" ? "Sarah is the General Manager. She is warm, supportive, but strictly professional. She manages schedules, approves vacations, and guides on shift swap rules. She mentions workforce guidelines when asked (e.g. 'Release shifts 24h in advance to avoid penalties')." : ""}
- ${recipient === "Alex Rivers" ? "Alex Rivers is your friendly coworker and fellow bartender. He talks in a casual, supportive, slightly rushed text tone. He is open to swapping shifts if it fits. Uses colloquial words ('hey buddy', 'sure thing', 'swapping via the Schedule tab is super easy!')." : ""}
- ${recipient === "Chef Marco" ? "Chef Marco is the head chef at Wayback Bar & Grill. He is passionate, efficient, and slightly grumbly but holds deep respect for hard work. He cares deeply about food safety protocols, kitchen sanitation starting Monday, and ensuring Floor 2 has dinner server coverage." : ""}
- Speak in first-person as ${recipient}.
- Keep replies relatively brief (1-3 sentences) suitable for a mobile text message format.
- Maintain a realistic workplace ecosystem. Do not break character. Do not output markdown lists or bullet points unless explicitly helpful; write like standard conversational text messages.
`;

      const promptContents = messages.map((m: any) => {
        return m.sender === "user"
          ? `Alex (Me): ${m.text}`
          : `${recipient}: ${m.text}`;
      }).join("\n");

      const finalQuery = `${promptContents}\n\nProvide the next single response from ${recipient} to Alex:`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: finalQuery,
        config: {
          systemInstruction: characterContext,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "I am here to help!";
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate response", details: error.message });
    }
  });

  // Setup Express + Vite middleware / static files serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WorkforcePro] App running on http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
