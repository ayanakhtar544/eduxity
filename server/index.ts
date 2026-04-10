import "dotenv/config";
import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import cors from "cors";

// ── Prisma Safety Check ──────────────────────────────────────────────────
import { prisma } from "@/server/prismaClient";

async function checkDb() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ [DB] Prisma connected");
  } catch (e: any) {
    console.error("❌ [DB] Prisma connection failed:", e.message);
  }
}

// ── Env Validation (fail fast) ───────────────────────────────────────────
const REQUIRED_ENV = ["DATABASE_URL"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`❌ [Server] Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// ── Express App ──────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "5mb" }));

// ── Health ───────────────────────────────────────────────────────────────
app.get("/health", (_req: ExpressRequest, res: ExpressResponse) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ── Route adapter for Expo Router-style handlers ─────────────────────────
//
// Each +api.ts file exports named handlers (GET, POST, PUT, DELETE).
// This adapter bridges them to Express without needing to rewrite each route.
//
type RouteContext = { params: Record<string, string> };
type RouteHandler = (
  req: globalThis.Request,
  context: RouteContext,
) => Promise<globalThis.Response> | globalThis.Response;

function makeHandler(module: Record<string, RouteHandler>) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    const method = req.method.toUpperCase() as keyof typeof module;
    const handler = module[method];
    if (!handler) {
      return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }
    try {
      // Build a Web-API–compatible Request object from Express req
      const url = `http://localhost${req.originalUrl}`;
      const headersInit: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headersInit[k] = v;
      }
      const webReq = new globalThis.Request(url, {
        method: req.method,
        headers: headersInit,
        ...(["POST", "PUT", "PATCH"].includes(req.method)
          ? { body: JSON.stringify(req.body) }
          : {}),
      });

      const webRes = await handler(webReq, {
        params: req.params as Record<string, string>,
      });
      const body = await webRes.json().catch(() => ({}));
      return res.status(webRes.status).json(body);
    } catch (err: any) {
      console.error(`[API] ${req.method} ${req.path}`, err?.message);
      return res.status(500).json({ success: false, error: err?.message || "Internal error" });
    }
  };
}

// ── Import all route modules ──────────────────────────────────────────────
import * as feedApi from "../app/api/feed/+api";
import * as authApi from "../app/api/auth/sync/+api";
import * as usersApi from "../app/api/users/+api";
import * as saveTokenApi from "../app/api/users/save-token/+api";
import * as updateTokenApi from "../app/api/users/update-token/+api";
import * as userByIdApi from "../app/api/users/[id]/+api";
import * as sessionsStartApi from "../app/api/sessions/start/+api";
import * as sessionsItemsApi from "../app/api/sessions/[id]/items/+api";
import * as sessionsCompleteApi from "../app/api/sessions/[id]/complete/+api";
import * as sessionsGenerateMoreApi from "../app/api/sessions/[id]/generate-more/+api";
import * as aiGenerateApi from "../app/api/ai/generate/+api";
import * as interactionsApi from "../app/api/interactions/+api";
import * as leaderboardApi from "../app/api/leaderboard/+api";
import * as streakApi from "../app/api/streak/update/+api";
import * as reviewApi from "../app/api/review/due/+api";
import * as dailyChallengeApi from "../app/api/daily-challenge/+api";
import * as dailyChallengeCompleteApi from "../app/api/daily-challenge/complete/+api";
import * as notificationsSendApi from "../app/api/notifications/send/+api";
import * as notificationsSendToUserApi from "../app/api/notifications/send-to-user/+api";

// ── Mount Routes ──────────────────────────────────────────────────────────
// IMPORTANT: Specific static paths MUST be registered before parameterized
// routes (e.g. /users/save-token before /users/:id) otherwise Express will
// greedily match `:id` and the static routes become unreachable.

app.all("/api/feed", makeHandler(feedApi as any));
app.all("/api/auth/sync", makeHandler(authApi as any));

// Users — static sub-routes FIRST, parameterized (:id) LAST
app.all("/api/users/save-token", makeHandler(saveTokenApi as any));
app.all("/api/users/update-token", makeHandler(updateTokenApi as any));
app.all("/api/users", makeHandler(usersApi as any));
app.all("/api/users/:id", makeHandler(userByIdApi as any));

// Sessions — static sub-routes FIRST
app.all("/api/sessions/start", makeHandler(sessionsStartApi as any));
app.all("/api/sessions/:id/items", makeHandler(sessionsItemsApi as any));
app.all("/api/sessions/:id/complete", makeHandler(sessionsCompleteApi as any));
app.all("/api/sessions/:id/generate-more", makeHandler(sessionsGenerateMoreApi as any));

app.all("/api/ai/generate", makeHandler(aiGenerateApi as any));
app.all("/api/interactions", makeHandler(interactionsApi as any));
app.all("/api/leaderboard", makeHandler(leaderboardApi as any));
app.all("/api/streak/update", makeHandler(streakApi as any));
app.all("/api/review/due", makeHandler(reviewApi as any));

// Daily challenge — static sub-routes FIRST
app.all("/api/daily-challenge/complete", makeHandler(dailyChallengeCompleteApi as any));
app.all("/api/daily-challenge", makeHandler(dailyChallengeApi as any));

app.all("/api/notifications/send-to-user", makeHandler(notificationsSendToUserApi as any));
app.all("/api/notifications/send", makeHandler(notificationsSendApi as any));

// ── Global Error Handler ─────────────────────────────────────────────────
app.use((err: Error, _req: ExpressRequest, res: ExpressResponse, _next: NextFunction) => {
  console.error("[Server] Unhandled error:", err.message);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, async () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  await checkDb();
});

export default app;
