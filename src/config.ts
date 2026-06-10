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

export function parseConfig(raw: string): Config {
  let config: Config;
  try {
    config = JSON.parse(raw) as Config;
  } catch {
    throw new Error("CONFIG secret is not valid JSON.");
  }

  if (!Array.isArray(config.auth) || config.auth.length === 0) {
    throw new Error("CONFIG must have a non-empty 'auth' array.");
  }
  for (const cred of config.auth) {
    if (!cred.username || !cred.password) {
      throw new Error(`Each auth entry must have 'username' and 'password'. Got: ${JSON.stringify(cred)}`);
    }
  }

  if (!Array.isArray(config.users) || config.users.length === 0) {
    throw new Error("CONFIG must have a non-empty 'users' array.");
  }
  for (const user of config.users) {
    if (!user.name || !user.token) {
      throw new Error(`Each user must have 'name' and 'token'. Got: ${JSON.stringify(user)}`);
    }
  }

  return config;
}

let _cached: Config | null = null;

export function getConfig(env: { CONFIG: string }): Config {
  if (!_cached) _cached = parseConfig(env.CONFIG);
  return _cached;
}
