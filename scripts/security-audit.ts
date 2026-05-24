import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scannedRoots = ["app", "components", "lib", "scripts", "prisma"];
const ignoredDirs = new Set([".git", ".next", "node_modules", "generated-assets"]);
const issues: string[] = [];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(ts|tsx|js|jsx|md|prisma|json)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function rel(file: string) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function trackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

const files = scannedRoots.flatMap((dir) => walk(path.join(root, dir)));

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const relative = rel(file);

  if (relative !== "scripts/security-audit.ts" && source.includes("dangerouslySetInnerHTML")) {
    issues.push(`${relative}: uses dangerouslySetInnerHTML`);
  }

  const publicSecretMatches = source.match(
    /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|DATABASE|DIRECT_URL|AUTH|PASSWORD|PRIVATE)[A-Z0-9_]*/g
  );
  if (publicSecretMatches?.length) {
    issues.push(`${relative}: suspicious public env var ${[...new Set(publicSecretMatches)].join(", ")}`);
  }

  const isClientFile = /^\s*["']use client["'];?/m.test(source);
  if (
    isClientFile &&
    /(SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|DIRECT_URL|AUTH_SECRET|NEXTAUTH_SECRET|passwordHash)/.test(source)
  ) {
    issues.push(`${relative}: client component references server-only secret or password field`);
  }

  if (
    relative.startsWith("app/api/") &&
    /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(source) &&
    !/(apiAdmin|apiUser|requireAdmin|requireUser|getCurrentUser)/.test(source)
  ) {
    issues.push(`${relative}: mutation route does not appear to call an auth helper`);
  }
}

const tracked = trackedFiles();
for (const file of tracked) {
  if (
    file === ".env" ||
    file === ".env.local" ||
    /^\.env\..*\.local$/.test(file) ||
    file.endsWith(".zip") ||
    file.startsWith("generated-assets/")
  ) {
    issues.push(`${file}: should not be tracked`);
  }
}

if (issues.length) {
  console.error("Security audit found issues:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Security audit passed.");
console.log(`Scanned ${files.length} source/config files.`);
