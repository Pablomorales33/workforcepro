const functions = require("firebase-functions");
const express = require("express");
const Stripe = require("stripe");
const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

// Initialize the secure server-bound Gemini client
let aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
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
let stripeClient = null;
function getStripeClient() {
  if (!stripeClient) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      stripeClient = new Stripe(stripeKey, {
        apiVersion: "2025-02-18-ac",
      });
    }
  }
  return stripeClient;
}

const app = express();

// CORS middleware to match v2 onRequest({ cors: true })
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  next();
});

// Stripe Webhook Endpoint (uses rawBody) - registered on app directly to preserve req.rawBody
app.post(["/stripe/webhook", "/api/stripe/webhook"], async (req, res) => {
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
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log(`[Stripe Webhook] Received event type: ${event.type}`);

  res.json({ received: true });
});

// Use router to handle both /api and / base paths cleanly
const router = express.Router();
router.use(express.json());

// Stripe Checkout Session Endpoint
router.post("/stripe/create-checkout-session", async (req, res) => {
  const { planId, billingCycle, origin } = req.body;

  const rootUrl = origin || "https://workforcepro.tech";
  const successUrl = `${rootUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}&plan=${planId}&cycle=${billingCycle}`;
  const cancelUrl = `${rootUrl}?payment=cancel&plan=${planId}`;

  const stripe = getStripeClient();
  if (!stripe) {
    console.log(`[Stripe Simulator] Creating mock checkout session for plan: ${planId}`);
    const mockSessionUrl = `${rootUrl}?payment=success&session_id=mock_session_${Date.now()}&plan=${planId}&cycle=${billingCycle}`;
    res.json({ url: mockSessionUrl, simulated: true });
    return;
  }

  try {
    const unitAmount = planId === "starter" ? 200 : 400;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `WorkforcePro ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `SaaS Billing subscription - Monthly Billing`,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: "month",
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
  } catch (error) {
    console.error("Stripe API Session Error (falling back to simulator):", error);
    const mockSessionUrl = `${rootUrl}?payment=success&session_id=mock_session_${Date.now()}_fallback&plan=${planId}&cycle=${billingCycle}`;
    res.json({ url: mockSessionUrl, simulated: true, warning: error.message });
  }
});

// Stripe Portal Session Endpoint
router.post("/stripe/create-portal-session", async (req, res) => {
  const { origin } = req.body;
  const stripe = getStripeClient();
  if (!stripe) {
    console.log("[Stripe Simulator] Creating mock Customer Portal session redirection");
    res.json({ url: `${origin || "https://workforcepro.tech"}?portal=simulated`, simulated: true });
    return;
  }

  try {
    const testCustomerId = process.env.STRIPE_TEST_CUSTOMER_ID || "cus_demo_placeholder";
    const session = await stripe.billingPortal.sessions.create({
      customer: testCustomerId,
      return_url: origin || "https://workforcepro.tech",
    });

    res.json({ url: session.url, simulated: false });
  } catch (error) {
    console.error("Stripe Portal Error (falling back to simulator):", error);
    res.json({ url: `${origin || "https://workforcepro.tech"}?portal=simulated`, simulated: true });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Secure Gemini Chat Proxy
router.post("/chat", async (req, res) => {
  const { messages, recipient, recipientRole } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid messages format" });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      let mockResponse = "Hey there! I am currently running in offline simulation mode.";
      res.json({ text: mockResponse });
      return;
    }

    const client = getGeminiClient();
    const characterContext = `You are simulating a text messaging dialogue inside the 'WorkforcePro' workforce app. The current user is 'Alex', a reliable service employee at 'Wayback Bar & Grill'. You are playing the role of: **${recipient}** (${recipientRole}).`;
    const promptContents = messages.map((m) => {
      return m.sender === "user" ? `Alex (Me): ${m.text}` : `${recipient}: ${m.text}`;
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

    res.json({ text: response.text || "I am here to help!" });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

app.use("/api", router);
app.use("/", router);

// Export Express app as Cloud Function v1
exports.api = functions.https.onRequest(app);
