// backend/src/config/env.ts
import "dotenv/config";

function list(key: string, fallback: string[] = []) {
  const raw = process.env[key];
  return raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : fallback;
}

export const env = {
  PORT: Number(process.env.PORT || 8080),
  CORS_ORIGINS: list("CORS_ORIGINS", ["http://localhost:19006"])
};
