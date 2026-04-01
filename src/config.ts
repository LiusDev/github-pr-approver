import { readFileSync } from "fs";
import { resolve } from "path";

export interface User {
  name: string;
  token: string;
}

export interface BasicAuthCredential {
  username: string;
  password: string;
}

interface Config {
  auth: BasicAuthCredential[];
  users: User[];
}

export function loadConfig(): Config {
  const configPath = resolve(process.cwd(), "config.json");
  let raw: string;
  try {
    raw = readFileSync(configPath, "utf-8");
  } catch {
    throw new Error(
      "config.json not found. Copy config.example.json to config.json and fill in your GitHub tokens."
    );
  }

  const config = JSON.parse(raw) as Config;

  if (!Array.isArray(config.auth) || config.auth.length === 0) {
    throw new Error("config.json must have a non-empty 'auth' array.");
  }
  for (const cred of config.auth) {
    if (!cred.username || !cred.password) {
      throw new Error(`Each auth entry must have 'username' and 'password'. Got: ${JSON.stringify(cred)}`);
    }
  }

  if (!Array.isArray(config.users) || config.users.length === 0) {
    throw new Error("config.json must have a non-empty 'users' array.");
  }
  for (const user of config.users) {
    if (!user.name || !user.token) {
      throw new Error(`Each user must have 'name' and 'token'. Got: ${JSON.stringify(user)}`);
    }
  }

  return config;
}
