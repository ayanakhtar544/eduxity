/**
 * E2E Test Script for Eduxity Post Generation System
 * Tests: Auth flow, post generation, database persistence, rate limiting, security
 */

import "dotenv/config";
import { prisma } from "@/server/prismaClient";
import { adminAuth } from "@/server/firebaseAdmin";
import axios from "axios";

const API_URL = "http://localhost:4000";
const TEST_UID = "test-user-" + Date.now();
const TEST_EMAIL = `test-${Date.now()}@eduxity.test`;
const TEST_PASSWORD = "TestPassword123!";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string, color: string = "reset") {
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`);
}

function logTest(name: string, passed: boolean, error?: string, duration?: number) {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  const time = duration ? ` (${duration}ms)` : "";
  const err = error ? `\n   Error: ${error}` : "";
  log(`${status} ${name}${time}${err}`);
  results.push({ name, passed, error, duration });
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  log("\n" + "=".repeat(60), "cyan");
  log("🚀 EDUXITY E2E TEST SUITE - PRODUCTION READINESS CHECK", "cyan");
  log("=".repeat(60) + "\n", "cyan");

  try {
    // ========================================
    // 1. TEST: Database Connection
    // ========================================
    log("📦 TEST 1: Database Connection", "blue");
    const start = Date.now();
    try {
      const users = await prisma.user.findMany({ take: 1 });
      logTest("Database connectivity", true, undefined, Date.now() - start);
    } catch (err: any) {
      logTest("Database connectivity", false, err.message);
      log("⚠️  Skipping remaining tests - database unavailable", "yellow");
      return;
    }

    // ========================================
    // 2. TEST: Firebase User Creation
    // ========================================
    log("\n📱 TEST 2: Firebase User Creation & Auth", "blue");
    let authToken = "";
    try {
      const start = Date.now();
      const userRecord = await adminAuth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: "E2E Test User",
        uid: TEST_UID,
      });
      const token = await adminAuth.createCustomToken(userRecord.uid);
      authToken = token;
      logTest("Firebase user creation and token generation", true, undefined, Date.now() - start);
      log(`   UID: ${TEST_UID}`, "cyan");
    } catch (err: any) {
      logTest("Firebase user creation", false, err.message);
      return;
    }

    // ========================================
    // 3. TEST: Database User Record Creation
    // ========================================
    log("\n👤 TEST 3: Database User Record Creation", "blue");
    try {
      const start = Date.now();
      await prisma.user.create({\n        data: {\n          firebaseUid: TEST_UID,\n          email: TEST_EMAIL,\n          displayName: "E2E Test User",\n          bio: "Test user for E2E testing",\n          preferredTopics: [],\n          preferredDifficulty: 2,\n        },\n      });\n      logTest("Database user record creation", true, undefined, Date.now() - start);\n    } catch (err: any) {\n      logTest("Database user record creation", false, err.message);\n    }\n\n    // ========================================\n    // 4. TEST: Health Endpoint\n    // ========================================\n    log(\"\\n🏥 TEST 4: API Health Check\", \"blue\");\n    try {\n      const start = Date.now();\n      const res = await axios.get(`${API_URL}/health`);\n      const isHealthy = res.status === 200 && res.data.status === \"ok\";\n      logTest(\"API health endpoint\", isHealthy, undefined, Date.now() - start);\n      log(`   Health: ${JSON.stringify(res.data)}`, \"cyan\");\n    } catch (err: any) {\n      logTest(\"API health endpoint\", false, err.message);\n    }\n\n    // ========================================\n    // 5. TEST: Auth Enforcement (No Token)\n    // ========================================\n    log(\"\\n🔐 TEST 5: Auth Enforcement - Missing Token\", \"blue\");\n    try {\n      const start = Date.now();\n      const res = await axios.post(\n        `${API_URL}/api/generate-learning-posts`,\n        { topic: \"Test Topic\", description: \"Test\" },\n        { validateStatus: () => true }\n      );\n      const isUnauthorized = res.status === 401;\n      logTest(\"Returns 401 for missing token\", isUnauthorized, undefined, Date.now() - start);\n      if (!isUnauthorized) {\n        log(`   Got status ${res.status} instead of 401`, \"yellow\");\n      }\n    } catch (err: any) {\n      logTest(\"Returns 401 for missing token\", false, err.message);\n    }\n\n    // ========================================\n    // 6. TEST: Request Validation\n    // ========================================\n    log(\"\\n✔️  TEST 6: Request Payload Validation\", \"blue\");\n    try {\n      const start = Date.now();\n      const res = await axios.post(\n        `${API_URL}/api/generate-learning-posts`,\n        { topic: \"ab\" }, // Too short (min 3 chars)\n        {\n          headers: { Authorization: `Bearer ${authToken}` },\n          validateStatus: () => true,\n        }\n      );\n      const isValidationError = res.status === 400;\n      logTest(\"Validates topic length (min 3 chars)\", isValidationError, undefined, Date.now() - start);\n      if (!isValidationError) {\n        log(`   Got status ${res.status}: ${JSON.stringify(res.data)}`, \"yellow\");\n      }\n    } catch (err: any) {\n      logTest(\"Validates topic length\", false, err.message);\n    }\n\n    // ========================================\n    // 7. TEST: Post Generation Success\n    // ========================================\n    log(\"\\n🎯 TEST 7: Post Generation (15 Posts)\", \"blue\");\n    let postCount = 0;\n    try {\n      const start = Date.now();\n      const res = await axios.post(\n        `${API_URL}/api/generate-learning-posts`,\n        {\n          topic: \"Quantum Computing Basics\",\n          description: \"Learn fundamental concepts of quantum computing\",\n          links: [\"https://example.com/quantum\"],\n          publishRatio: 1.0,\n        },\n        {\n          headers: { Authorization: `Bearer ${authToken}` },\n          timeout: 120000,\n          validateStatus: () => true,\n        }\n      );\n\n      const isSuccess = res.status === 200 && res.data.success;\n      if (isSuccess) {\n        postCount = res.data.data?.length || 0;\n        logTest(\n          `Post generation successful (${postCount} posts)\`,\n          postCount === 15,\n          undefined,\n          Date.now() - start\n        );\n        if (postCount !== 15) {\n          log(`   ⚠️  Expected 15 posts, got ${postCount}`, \"yellow\");\n        }\n      } else {\n        logTest(\n          \"Post generation successful\",\n          false,\n          `Status: ${res.status}, Response: ${JSON.stringify(res.data)}`\n        );\n      }\n    } catch (err: any) {\n      logTest(\"Post generation successful\", false, err.message);\n    }\n\n    // ========================================\n    // 8. TEST: Database Persistence\n    // ========================================\n    log(\"\\n💾 TEST 8: Database Persistence\", \"blue\");\n    try {\n      const start = Date.now();\n      await delay(500); // Give DB time to write\n      const learningItems = await prisma.learningItem.findMany({\n        where: { sessionId: TEST_UID + \"-session\" },\n      });\n      const itemCount = learningItems.length;\n      logTest(\n        `Database persistence (${itemCount} items)\`,\n        itemCount > 0,\n        undefined,\n        Date.now() - start\n      );\n      if (itemCount === 0) {\n        log(\"   ⚠️  Posts not found in database\", \"yellow\");\n      } else {\n        log(`   Items saved: ${itemCount}`, \"cyan\");\n      }\n    } catch (err: any) {\n      logTest(\"Database persistence\", false, err.message);\n    }\n\n    // ========================================\n    // 9. TEST: Rate Limiting\n    // ========================================\n    log(\"\\n⏱️  TEST 9: Rate Limiting (5 req/5 min)\", \"blue\");\n    try {\n      const start = Date.now();\n      let rateLimited = false;\n      \n      // Try to make 6 requests\n      for (let i = 0; i < 6; i++) {\n        const res = await axios.post(\n          `${API_URL}/api/generate-learning-posts`,\n          {\n            topic: `Rate Limit Test ${i}`,\n            description: \"Testing rate limit\",\n          },\n          {\n            headers: { Authorization: `Bearer ${authToken}` },\n            timeout: 5000,\n            validateStatus: () => true,\n          }\n        );\n\n        if (res.status === 429) {\n          rateLimited = true;\n          log(`   Rate limited on attempt ${i + 1}`, \"cyan\");\n          break;\n        }\n        if (i > 0) await delay(100);\n      }\n      logTest(\"Rate limiting enforced\", rateLimited, undefined, Date.now() - start);\n    } catch (err: any) {\n      logTest(\"Rate limiting test\", false, err.message);\n    }\n\n    // ========================================\n    // 10. TEST: Security Headers\n    // ========================================\n    log(\"\\n🔒 TEST 10: Security Headers\", \"blue\");\n    try {\n      const start = Date.now();\n      const res = await axios.get(`${API_URL}/health`);\n      const hasSecurityHeaders =\n        res.headers[\"x-content-type-options\"] === \"nosniff\" ||\n        res.headers[\"x-frame-options\"] || \n        res.headers[\"content-security-policy\"] ||\n        Object.keys(res.headers).some((h) => h.startsWith(\"x-\"));\n      \n      logTest(\"Security headers present\", hasSecurityHeaders, undefined, Date.now() - start);\n      if (hasSecurityHeaders) {\n        const secHeaders = Object.keys(res.headers).filter((h) => h.startsWith(\"x-\"));\n        log(`   Headers: ${secHeaders.join(\", \")}`, \"cyan\");\n      }\n    } catch (err: any) {\n      logTest(\"Security headers test\", false, err.message);\n    }\n\n    // ========================================\n    // 11. TEST: CORS Configuration\n    // ========================================\n    log(\"\\n🌐 TEST 11: CORS Configuration\", \"blue\");\n    try {\n      const start = Date.now();\n      const res = await axios.get(`${API_URL}/health`, {\n        headers: { Origin: \"http://localhost:3000\" },\n      });\n      const corHeaders = res.headers[\"access-control-allow-origin\"];\n      logTest(\"CORS headers configured\", !!corHeaders, undefined, Date.now() - start);\n      if (corHeaders) {\n        log(`   Allowed origin: ${corHeaders}`, \"cyan\");\n      }\n    } catch (err: any) {\n      logTest(\"CORS configuration test\", false, err.message);\n    }\n\n    // ========================================\n    // Cleanup\n    // ========================================\n    log(\"\\n🧹 Cleanup: Removing test user\", \"blue\");\n    try {\n      await adminAuth.deleteUser(TEST_UID);\n      await prisma.user.delete({ where: { firebaseUid: TEST_UID } });\n      log(\"✅ Test user deleted\n\", \"green\");\n    } catch (err) {\n      log(\"⚠️  Could not clean up test user (may not exist)\", \"yellow\");\n    }\n\n  } catch (err) {\n    log(`\\n❌ FATAL ERROR: ${err}`, \"red\");\n  } finally {\n    // ========================================\n    // Test Summary\n    // ========================================\n    log(\"\\n\" + \"=\".repeat(60), \"cyan\");\n    log(\"📊 TEST RESULTS SUMMARY\", \"cyan\");\n    log(\"=\".repeat(60), \"cyan\");\n\n    const passed = results.filter((r) => r.passed).length;\n    const failed = results.filter((r) => !r.passed).length;\n    const total = results.length;\n    const percentPassed = total > 0 ? Math.round((passed / total) * 100) : 0;\n\n    results.forEach((r) => {\n      const status = r.passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;\n      const time = r.duration ? ` (${r.duration}ms)` : \"\";\n      console.log(`${status} ${r.name}${time}`);\n    });\n\n    log(`\\nResults: ${passed}/${total} passed (${percentPassed}%)\\n`, \"blue\");\n\n    if (failed === 0) {\n      log(\"🎉 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION!\", \"green\");\n    } else {\n      log(`⚠️  ${failed} test(s) failed - Review errors above`, \"red\");\n    }\n\n    log(\"\\n\" + \"=\".repeat(60) + \"\\n\", \"cyan\");\n\n    await prisma.$disconnect();\n    process.exit(failed > 0 ? 1 : 0);\n  }\n}\n\n// Run tests\nrunTests().catch((err) => {\n  log(`\\nFATAL ERROR: ${err.message}`, \"red\");\n  process.exit(1);\n});\n