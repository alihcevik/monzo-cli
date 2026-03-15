import { getValidToken } from "../auth/token.js";
import { MonzoApiError, MonzoAuthError } from "../utils/errors.js";

const BASE_URL = "https://api.monzo.com";

export async function monzoGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getValidToken();

  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new MonzoAuthError("Session expired. Please run `monzo login`.");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new MonzoApiError(
      `${res.status} ${res.statusText}: ${text}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export async function monzoPost<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const token = await getValidToken();

  const res = await fetch(new URL(path, BASE_URL), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });

  if (res.status === 401) {
    throw new MonzoAuthError("Session expired. Please run `monzo login`.");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new MonzoApiError(
      `${res.status} ${res.statusText}: ${text}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}
