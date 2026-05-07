import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const expectedKey = process.env.README_API_KEY;
    if (expectedKey) {
      const auth = request.headers.get("authorization") ?? "";
      const provided = auth.startsWith("Bearer ")
        ? auth.slice("Bearer ".length)
        : "";
      if (!provided || provided !== expectedKey) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const readmePath = path.resolve(process.cwd(), "..", "..", "..", "README.md");
    const markdown = await readFile(readmePath, "utf8");
    return NextResponse.json(
      {
        markdown,
        loadedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "readme_unavailable",
        detail:
          process.env.NODE_ENV === "production"
            ? "unavailable"
            : error instanceof Error
              ? error.message
              : "unknown",
      },
      { status: 500 }
    );
  }
}

