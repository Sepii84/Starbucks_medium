import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { deleteUploadedImageIfUnused } from "@/lib/admin/storage-images";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { response } = await apiAdmin();
  if (response) return response;

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
        reason: error instanceof Error ? error.message : "Could not delete uploaded image."
      },
      { status: 400 }
    );
  }
}
