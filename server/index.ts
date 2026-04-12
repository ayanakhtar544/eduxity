import { adminAuth } from "@/server/firebaseAdmin";
import { generateLearningPosts } from "@/server/services/learningPostGenerator";
import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";

const app = express();

// ============================================
// 🔒 SECURITY MIDDLEWARE (Apply First)
// ============================================

// Security headers
app.use(helmet());

// CORS with strict settings
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:8081",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health", // Don't rate limit health checks
  keyGenerator: ipKeyGenerator,
});

// Strict rate limiter for post generation: 5 requests per 5 minutes per IP
const generatePostsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many post generation requests. Maximum 5 per 5 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});

app.use(generalLimiter);
app.use(express.json({ limit: "10mb" }));

const GenerateLearningPostRequestSchema = z.object({
  topic: z.string().min(3),
  description: z.string().max(2000).optional(),
  links: z.array(z.string().url()).optional(),
  publishRatio: z.number().min(0).max(1).optional(),
  language: z.string().min(2).optional(),
});

const verifyBearerToken = async (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice("Bearer ".length);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.warn("Invalid authorization token", error);
    return null;
  }
};

app.get("/health", (req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

const handleGenerate = async (req: express.Request, res: express.Response) => {
  console.log("API HIT", req.path);
  console.log("payload received", req.body);

  const uid = await verifyBearerToken(req.headers.authorization as string);
  if (!uid) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const parseResult = GenerateLearningPostRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.warn("Payload validation failed", parseResult.error.format());
    return res.status(400).json({
      success: false,
      error: parseResult.error.message,
    });
  }

  try {
    const response = await generateLearningPosts({
      ...parseResult.data,
      uid,
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error processing ${req.path}:`, error);
    return res
      .status(500)
      .json({ success: false, error: "Unable to generate learning posts" });
  }
};

app.post("/api/generate-learning-posts", generatePostsLimiter, handleGenerate);
app.post("/api/ai/generate", generatePostsLimiter, handleGenerate);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error("[ERROR]", {
    status: statusCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Rate limit errors get 429
  if (message?.includes("Too many")) {
    return res.status(429).json({ success: false, error: message });
  }

  // Validation errors get 400
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: "Invalid request payload",
      details: err.errors,
    });
  }

  res.status(statusCode).json({ success: false, error: message });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(
    `📊 Rate limiting: 100 req/15min (general), 5 req/5min (post generation)`,
  );
  console.log(`🔒 Security: Helmet enabled, CORS configured`);
});

export default app;
