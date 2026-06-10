import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { getConfig } from "./config";
import { approvePr, approvePrAndMerge, parsePrUrl } from "./github";
import { Home } from "./Home";

type Env = { CONFIG: string };

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const cfg = getConfig(c.env);
  return basicAuth({
    verifyUser: (username, password) =>
      cfg.auth.some((a) => a.username === username && a.password === password),
  })(c, next);
});

app.get("/", (c) => {
  return c.html(<Home />);
});

app.get("/api/users", (c) => {
  const cfg = getConfig(c.env);
  return c.json(cfg.users.map((u) => u.name));
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

  const cfg = getConfig(c.env);
  const user = cfg.users.find((u) => u.name === userName);
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

app.post("/api/approve-and-merge", async (c) => {
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

  const cfg = getConfig(c.env);
  const user = cfg.users.find((u) => u.name === userName);
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
    const result = await approvePrAndMerge(coords, user.token);
    return c.json({
      success: true,
      message: `Approved and merged PR #${result.prNumber} in ${result.repoFullName}`,
      prTitle: result.prTitle,
      prNumber: result.prNumber,
      repoFullName: result.repoFullName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, message }, 500);
  }
});

export default app;
