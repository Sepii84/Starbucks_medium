import crypto from "node:crypto";
import { prisma } from "../prisma";

export type UploadFolder = "menu-items" | "gift-cards";

export type UploadedImage = {
  url: string;
  path: string;
  bucket: string;
};

export type DeleteImageResult = {
  deleted: boolean;
  reason: string;
  path?: string;
};

export class StorageImageError extends Error {}

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);
const maxFileSize = 5 * 1024 * 1024;
const allowedFolders = new Set<UploadFolder>(["menu-items", "gift-cards"]);

export function getOptionalImageFile(formData: FormData, key = "imageFile") {
  const value = formData.get(key);

  if (!isFileLike(value) || value.size === 0) {
    return null;
  }

  return value;
}

export async function uploadAdminImageFile(
  file: File,
  folder: UploadFolder,
  nameHint: string
): Promise<UploadedImage> {
  if (!allowedFolders.has(folder)) {
    throw new StorageImageError("Invalid upload destination.");
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new StorageImageError("Only JPG, PNG, and WebP images are supported.");
  }

  if (file.size > maxFileSize) {
    throw new StorageImageError("Image is too large. Maximum size is 5 MB.");
  }

  const config = storageConfig();
  const safeName = slugify(nameHint || file.name.replace(/\.[^.]+$/, "")) || "admin-upload";
  const objectPath = `${folder}/${safeName}-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")}.${extension}`;
  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(
    config.bucket
  )}/${objectPath}`;

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Cache-Control": "31536000",
      "Content-Type": file.type,
      "x-upsert": "false"
    },
    body: Buffer.from(await file.arrayBuffer())
  });

  if (!uploadResponse.ok) {
    const details = await uploadResponse.text().catch(() => "");
    throw new StorageImageError(
      details || "Image upload failed. Check the Supabase Storage bucket and credentials."
    );
  }

  return {
    url: publicUrlForPath(objectPath),
    path: objectPath,
    bucket: config.bucket
  };
}

export async function deleteManagedStorageImage(value: string): Promise<DeleteImageResult> {
  const parsed = parseManagedStorageImage(value);

  if (!parsed) {
    return { deleted: false, reason: "Not a managed Supabase Storage image." };
  }

  return deleteManagedStoragePath(parsed.path);
}

export async function deleteManagedStoragePath(path: string): Promise<DeleteImageResult> {
  const safePath = normalizeManagedObjectPath(path);

  if (!safePath) {
    return { deleted: false, reason: "Storage path is outside allowed upload folders." };
  }

  const config = storageConfig();
  const deleteUrl = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}`;
  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefixes: [safePath] })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    return {
      deleted: false,
      reason: details || "Supabase Storage delete request failed.",
      path: safePath
    };
  }

  return { deleted: true, reason: "Deleted managed Supabase Storage image.", path: safePath };
}

export async function deleteUploadedImageIfUnused(imageUrl: string) {
  const parsed = parseManagedStorageImage(imageUrl);

  if (!parsed) {
    return { deleted: false, reason: "Image is local, external, or outside managed storage." };
  }

  const candidateValues = [...new Set([imageUrl, publicUrlForPath(parsed.path), parsed.path])];
  const [menuReferences, giftCardReferences] = await Promise.all([
    prisma.menuItem.count({ where: { imageUrl: { in: candidateValues } } }),
    prisma.giftCardTemplate.count({ where: { imageUrl: { in: candidateValues } } })
  ]);

  if (menuReferences + giftCardReferences > 0) {
    return { deleted: false, reason: "Image is still referenced by another database record." };
  }

  return deleteManagedStoragePath(parsed.path);
}

export function parseManagedStorageImage(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed.startsWith("/images/")) {
    return null;
  }

  const config = storageConfig();

  if (!URL.canParse(trimmed)) {
    const path = normalizeManagedObjectPath(trimmed);
    return path ? { bucket: config.bucket, path } : null;
  }

  const url = new URL(trimmed);
  const storageHost = new URL(config.supabaseUrl).host;

  if (url.host !== storageHost) {
    return null;
  }

  const pathParts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const objectIndex = pathParts.findIndex((part) => part === "object");
  const storageBucket = pathParts[objectIndex + 2];

  if (
    objectIndex === -1 ||
    pathParts[objectIndex + 1] !== "public" ||
    storageBucket !== config.bucket
  ) {
    return null;
  }

  const objectPath = pathParts.slice(objectIndex + 3).join("/");
  const safePath = normalizeManagedObjectPath(objectPath);

  return safePath ? { bucket: config.bucket, path: safePath } : null;
}

export async function listManagedStorageFiles() {
  const files: Array<{ path: string; url: string }> = [];

  for (const folder of allowedFolders) {
    files.push(...(await listStorageFolder(folder)));
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function publicUrlForPath(path: string) {
  const config = storageConfig();
  return `${config.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(
    config.bucket
  )}/${path}`;
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    typeof (value as File).size === "number"
  );
}

function normalizeManagedObjectPath(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");

  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.includes("//") ||
    ![...allowedFolders].some((folder) => normalized.startsWith(`${folder}/`))
  ) {
    return null;
  }

  return normalized;
}

function storageConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
    "site-images";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new StorageImageError(
      "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { supabaseUrl, serviceRoleKey, bucket };
}

async function listStorageFolder(folder: UploadFolder) {
  const config = storageConfig();
  const files: Array<{ path: string; url: string }> = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const response = await fetch(
      `${config.supabaseUrl}/storage/v1/object/list/${encodeURIComponent(config.bucket)}`,
      {
        method: "POST",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prefix: folder,
          limit,
          offset,
          sortBy: { column: "name", order: "asc" }
        })
      }
    );

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new StorageImageError(details || "Could not list Supabase Storage files.");
    }

    const rows = (await response.json()) as Array<{ name?: string; id?: string | null }>;

    for (const row of rows) {
      if (!row.name || row.id === null) {
        continue;
      }

      const path = normalizeManagedObjectPath(
        row.name.startsWith(`${folder}/`) ? row.name : `${folder}/${row.name}`
      );

      if (path) {
        files.push({ path, url: publicUrlForPath(path) });
      }
    }

    if (rows.length < limit) {
      break;
    }

    offset += limit;
  }

  return files;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
