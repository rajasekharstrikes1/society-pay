import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import express, { Request, Response, NextFunction } from "express";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

// Extend Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

// Razorpay credentials
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;
const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!key_id || !key_secret) {
  console.error("❌ Missing Razorpay credentials");
  process.exit(1);
}
const razorpay = new Razorpay({ key_id, key_secret });

// Express app setup
const app = express();

// Enable CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }
  next();
  return;
});
app.use(express.json());

// Middleware: Auth
const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    console.error("❌ Auth error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware: Validate required body fields
const validateRequest = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = fields.filter((f) => !req.body[f]);
    if (missing.length) {
      res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    } else {
      next();
    }
  };
};

// 🔹 Create Razorpay Order
app.post("/api/create-order", authenticateUser, validateRequest(["amount"]), async (req, res) => {
  try {
    const { amount, currency = "INR", notes = {} } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ error: "User not authenticated" });
    if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });

    const receipt = `rcpt_${user.uid.slice(0, 8)}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: { ...notes, userId: user.uid }
    });

    await db.collection("orders").doc(order.id).set({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      userId: user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      notes
    });

    return res.json({ message: "Order created", order });
  } catch (err) {
    console.error("❌ Order creation failed:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

// 🔹 Verify Payment & Activate Subscription
app.post("/api/verify-payment", authenticateUser, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    subscriptionId,
    communityId,
    duration
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !subscriptionId ||
    !communityId ||
    !duration
  ) {
    return res.status(400).json({ error: "Missing Razorpay fields", verified: false });
  }

  // Validate Signature
  const generatedSignature = crypto
    .createHmac("sha256", key_secret!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(razorpay_signature)
  );

  if (!isValid) {
    return res.status(400).json({ error: "Invalid signature", verified: false });
  }

  // Calculate subscription dates
  const durationMs = duration * 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMs);

  try {
    await db.doc(`communities/${communityId}`).update({
      subscription: {
        id: subscriptionId,
        status: "active",
        startedAt: admin.firestore.Timestamp.fromDate(now),
        endsAt: admin.firestore.Timestamp.fromDate(endsAt)
      },
      isActive: true,
      subscriptionEndDate: admin.firestore.Timestamp.fromDate(endsAt)
    });

    return res.status(200).json({ success: true, verified: true });
  } catch (error) {
    console.error("🔥 Firestore update failed:", error);
    return res.status(500).json({ error: "Internal error", verified: true });
  }
});

// 🔹 Razorpay Webhook (Optional)
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body.toString();

    if (!signature || !body || !webhook_secret) {
      return res.status(400).send("Invalid webhook");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhook_secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid webhook signature");
    }

    const event = JSON.parse(body);
    console.log("📦 Razorpay Webhook Event:", event?.event);
    return res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).send("Webhook failure");
  }
});

// 🔹 Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    razorpay: true,
    time: new Date().toISOString()
  });
});

// 🔚 Export API Handler
export const api = onRequest(
  { timeoutSeconds: 60, memory: "256MiB", maxInstances: 10 },
  app
);
