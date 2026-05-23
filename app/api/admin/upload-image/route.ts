import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import {
  getOptionalImageFile,
  type UploadFolder,
  uploadAdminImageFile
} from "@/lib/admin/storage-images";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { response } = await apiAdmin();
  if (response) return response;

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
      { error: error instanceof Error ? error.message : "Image upload failed." },
      { status: 400 }
    );
  }
}
