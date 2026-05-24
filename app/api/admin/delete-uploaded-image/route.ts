import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { deleteUploadedImageIfUnused, StorageImageError } from "@/lib/admin/storage-images";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, response } = await apiAdmin();
  if (response) return response;

  const rate = checkRateLimit(`admin-delete-upload:${user.id}`, {
    limit: 30,
    windowMs: 60_000
  });
  if (!rate.ok) {
    return NextResponse.json(
      { deleted: false, reason: rateLimitMessage(rate.retryAfter) },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    imageUrl?: string;
    path?: string;
  };
  const value = body.imageUrl ?? body.path ?? "";

  if (!value.trim()) {
    return NextResponse.json(
      { deleted: false, reason: "Image URL or storage path is required." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteUploadedImageIfUnused(value);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        deleted: false,
        reason:
          error instanceof StorageImageError
            ? error.message
            : "Could not delete uploaded image."
      },
      { status: 400 }
    );
  }
}
