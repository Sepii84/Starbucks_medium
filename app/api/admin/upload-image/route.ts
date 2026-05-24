import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import {
  getOptionalImageFile,
  StorageImageError,
  type UploadFolder,
  uploadAdminImageFile
} from "@/lib/admin/storage-images";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, response } = await apiAdmin();
  if (response) return response;

  const rate = checkRateLimit(`admin-upload:${user.id}`, { limit: 20, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: rateLimitMessage(rate.retryAfter) }, { status: 429 });
  }

  const formData = await request.formData();
  const file = getOptionalImageFile(formData, "file");
  const folder = String(formData.get("folder") ?? "") as UploadFolder;
  const nameHint = String(formData.get("nameHint") ?? "admin-upload");

  if (!file) {
    return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
  }

  try {
    return NextResponse.json(await uploadAdminImageFile(file, folder, nameHint));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof StorageImageError
            ? error.message
            : "Image upload failed."
      },
      { status: 400 }
    );
  }
}
