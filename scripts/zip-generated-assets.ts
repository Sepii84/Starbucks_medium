import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureDir, zipPath } from "./image-shared";

async function main() {
  const root = process.cwd();
  const outputDir = path.dirname(zipPath);
  await ensureDir(outputDir);

  try {
    await fs.rm(zipPath, { force: true });
  } catch {
    // Ignore missing zip.
  }

  const sources = [
    path.join(root, "public", "images", "menu"),
    path.join(root, "public", "images", "gift-cards"),
    path.join(root, "public", "images", "site")
  ];

  const existingSources = [];
  for (const source of sources) {
    try {
      const stat = await fs.stat(source);
      if (stat.isDirectory()) existingSources.push(source);
    } catch {
      // Optional source.
    }
  }

  if (!existingSources.length) {
    throw new Error("No generated image directories were found.");
  }

  if (process.platform === "win32") {
    const quotedSources = existingSources.map((source) => `'${source.replaceAll("'", "''")}\\*'`).join(",");
    const command = `Compress-Archive -Path ${quotedSources} -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], {
      stdio: "inherit"
    });

    if (result.status !== 0) {
      throw new Error("Compress-Archive failed.");
    }
  } else {
    const result = spawnSync("zip", ["-r", zipPath, ...existingSources], {
      stdio: "inherit"
    });

    if (result.status !== 0) {
      throw new Error("zip command failed.");
    }
  }

  console.log(`Generated asset zip: ${zipPath}`);
}

main().catch((error) => {
  console.error("Asset zip failed:", error);
  process.exit(1);
});
