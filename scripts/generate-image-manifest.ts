import { buildImageManifest, manifestPath, parseImageArgs, saveJson } from "./image-shared";

async function main() {
  const options = parseImageArgs();
  console.log("Building image manifest from project data...");
  const manifest = await buildImageManifest(options);
  await saveJson(manifestPath, manifest);
  console.log(`Image manifest written: ${manifestPath}`);
  console.log(`Targets: ${manifest.count}`);
}

main().catch((error) => {
  console.error("Image manifest generation failed:", error);
  process.exit(1);
});
