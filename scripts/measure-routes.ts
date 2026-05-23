import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { PrismaClient, Role } from "@prisma/client";
import * as nextEnv from "@next/env";
import { SignJWT } from "jose";

nextEnv.loadEnvConfig(process.cwd());

const port = Number(process.env.PERF_PORT ?? 3017);
const baseUrl = `http://127.0.0.1:${port}`;
const prisma = new PrismaClient();

const routes = [
  { path: "/", label: "home" },
  { path: "/menu", label: "menu" },
  { path: "/gift-cards", label: "gift-cards" },
  { path: "/rewards", label: "rewards" },
  { path: "/order", label: "order-user", auth: "user" as const },
  { path: "/wallet", label: "wallet-user", auth: "user" as const },
  { path: "/account", label: "account-user", auth: "user" as const },
  { path: "/admin", label: "admin", auth: "admin" as const },
  { path: "/admin/menu", label: "admin-menu", auth: "admin" as const },
  { path: "/admin/gift-cards", label: "admin-gift-cards", auth: "admin" as const }
];

async function main() {
  const iterations = Number(process.argv.find((arg) => arg.startsWith("--runs="))?.split("=")[1] ?? 3);
  const server = startServer();

  try {
    await waitForServer();
    const cookies = await createAuthCookies();
    const results = [];

    for (const route of routes) {
      await measure(route.path, cookies[route.auth ?? "public"]);
      const samples = [];

      for (let index = 0; index < iterations; index += 1) {
        samples.push(await measure(route.path, cookies[route.auth ?? "public"]));
      }

      const timings = samples.map((sample) => sample.ms);
      const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
      results.push({
        route: route.label,
        path: route.path,
        status: samples.at(-1)?.status,
        avgMs: Math.round(average),
        minMs: Math.round(Math.min(...timings)),
        maxMs: Math.round(Math.max(...timings)),
        bytes: samples.at(-1)?.bytes ?? 0
      });
    }

    console.table(results);
  } finally {
    await prisma.$disconnect();
    stopServer(server);
  }
}

function startServer() {
  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: process.env,
    windowsHide: true
  });

  child.stdout.on("data", (data) => process.stdout.write(`[next] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[next] ${data}`));

  return child;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status > 0) return;
    } catch {
      // Keep polling until next start is ready.
    }

    await wait(500);
  }

  throw new Error("Timed out waiting for Next.js server.");
}

async function createAuthCookies() {
  const [user, admin] = await Promise.all([
    prisma.user.findFirst({ where: { role: Role.USER, isActive: true } }),
    prisma.user.findFirst({ where: { role: Role.ADMIN, isActive: true } })
  ]);

  return {
    public: "",
    user: user ? `starbucks_medium_session=${await signSessionCookie(user)}` : "",
    admin: admin ? `starbucks_medium_session=${await signSessionCookie(admin)}` : ""
  };
}

async function signSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
}) {
  const secret =
    process.env.AUTH_SECRET ?? "development-only-secret-change-me-before-production-12345";
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));
}

async function measure(path: string, cookie: string) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: cookie ? { Cookie: cookie } : undefined,
    redirect: "manual"
  });
  const body = await response.arrayBuffer();

  return {
    status: response.status,
    ms: performance.now() - startedAt,
    bytes: body.byteLength
  };
}

function stopServer(server: ChildProcessWithoutNullStreams) {
  if (!server.killed) {
    server.kill();
  }
}

main().catch(async (error) => {
  await prisma.$disconnect().catch(() => undefined);
  console.error("Route measurement failed:", error);
  process.exit(1);
});
