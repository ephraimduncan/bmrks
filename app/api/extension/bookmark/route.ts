import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getUrlMetadata } from "@/lib/url-metadata";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

const extensionId = process.env.CHROME_EXTENSION_ID;

function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  if (extensionId) {
    origins.push(`chrome-extension://${extensionId}`);
  }
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
  }
  return origins;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

function corsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: "Forbidden", message: "Origin not allowed" },
      { status: 403, headers }
    );
  }

  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please log in to save bookmarks" },
        { status: 401, headers }
      );
    }

    const body = await request.json();
    const parsed = createBookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid URL provided" },
        { status: 400, headers }
      );
    }

    const { url, title: providedTitle } = parsed.data;

    const defaultGroup = await db.group.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (!defaultGroup) {
      return NextResponse.json(
        {
          error: "No Group",
          message: "No bookmark group found. Please create one first.",
        },
        { status: 400, headers }
      );
    }

    // Normalize URL and fetch metadata
    const normalizedUrl = normalizeUrl(url);
    const metadata = await getUrlMetadata(normalizedUrl);

    // Use provided title, fetched title, or fallback to URL
    const title = providedTitle || metadata.title || normalizedUrl;

    const bookmark = await db.bookmark.create({
      data: {
        title,
        url: normalizedUrl,
        favicon: metadata.favicon,
        type: "link",
        groupId: defaultGroup.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        bookmark: {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          groupName: defaultGroup.name,
        },
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Extension bookmark error:", error);
    return NextResponse.json(
      { error: "Server Error", message: "Failed to save bookmark" },
      { status: 500, headers }
    );
  }
}
