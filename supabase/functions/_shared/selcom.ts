// Shared Selcom Checkout API client (Tanzania — TZS, mobile money + cards).
// Docs: https://developers.selcommobile.com/

const BASE_URL = Deno.env.get("SELCOM_BASE_URL") || "https://apigw.selcommobile.com/v1";

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

function toBase64(input: string): string {
  return btoa(input);
}

async function hmacSha256Base64(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  let binary = "";
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Selcom expects an ISO-8601 timestamp in the merchant's timezone (EAT, +03:00). */
function eatTimestamp(): string {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return now.toISOString().replace(/\.\d{3}Z$/, "+03:00");
}

export async function selcomRequest<T = unknown>(
  path: string,
  method: "POST" | "GET",
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; body: T }> {
  const apiKey = requireEnv("SELCOM_API_KEY");
  const apiSecret = requireEnv("SELCOM_API_SECRET");

  const timestamp = eatTimestamp();
  const fields = Object.keys(payload);
  const signedString =
    `timestamp=${timestamp}` + fields.map((f) => `&${f}=${payload[f]}`).join("");
  const digest = await hmacSha256Base64(signedString, apiSecret);

  const url = method === "GET"
    ? `${BASE_URL}${path}?${new URLSearchParams(payload as Record<string, string>).toString()}`
    : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `SELCOM ${toBase64(apiKey)}`,
      "Digest-Method": "HS256",
      Digest: digest,
      Timestamp: timestamp,
      "Signed-Fields": fields.join(","),
    },
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    console.error(`Selcom ${path} failed [${res.status}]: ${text}`);
  }
  return { ok: res.ok, status: res.status, body: body as T };
}

export function vendorId(): string {
  return requireEnv("SELCOM_VENDOR_ID");
}

/** Normalises 0712..., +255712..., 255712... to Selcom's 255XXXXXXXXX format. */
export function normalizeMsisdn(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("0")) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  return digits;
}
