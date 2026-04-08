// Location: app/api/generate/+api.ts

export async function POST(request: Request) {
  try {
    // Backward compatible alias of /api/ai/generate
    return fetch(new URL("/api/ai/generate", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    });
  } catch {
    return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
