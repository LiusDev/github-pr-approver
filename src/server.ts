import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadConfig } from "./config.js";
import { approvePr, parsePrUrl } from "./github.js";

const config = loadConfig();
const app = new Hono();

app.use(
  "*",
  basicAuth({ verifyUser: (username, password) =>
    config.auth.some((c) => c.username === username && c.password === password)
  })
);

app.get("/", (c) => {
  const html = readFileSync(resolve(process.cwd(), "public/index.html"), "utf-8");
  return c.html(html);
});

app.get("/api/users", (c) => {
  return c.json(config.users.map((u) => u.name));
});

app.post("/api/approve", async (c) => {
  let body: { prUrl?: string; userName?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: "Invalid JSON body" }, 400);
  }

  const { prUrl, userName } = body;

  if (!prUrl || !userName) {
    return c.json({ success: false, message: "Missing prUrl or userName" }, 400);
  }

  const user = config.users.find((u) => u.name === userName);
  if (!user) {
    return c.json({ success: false, message: `User "${userName}" not found in config` }, 404);
  }

  let coords;
  try {
    coords = parsePrUrl(prUrl);
  } catch (err) {
    return c.json({ success: false, message: (err as Error).message }, 400);
  }

  try {
    const result = await approvePr(coords, user.token);
    return c.json({
      success: true,
      message: `Approved PR #${result.prNumber} in ${result.repoFullName}`,
      prTitle: result.prTitle,
      prNumber: result.prNumber,
      repoFullName: result.repoFullName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, message }, 500);
  }
});

const port = parseInt(process.env.PORT ?? "3456", 10);
console.log(`GitHub PR Approver running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
