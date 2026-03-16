import { requireApiKey } from "./auth.js";

const BASE_URL = "https://sc-mentor.fly.dev/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const apiKey = requireApiKey();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}