import "server-only";
import { cookies } from "next/headers";
import { PrivyClient } from "@privy-io/server-auth";

let _client: PrivyClient | null = null;

export function privyClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) return null;
  if (_client) return _client;
  _client = new PrivyClient(appId, secret);
  return _client;
}

export async function getPrivyDid(): Promise<string | null> {
  const client = privyClient();
  if (!client) return null;

  const c = await cookies();
  const token =
    c.get("privy-token")?.value ??
    c.get("privy-id-token")?.value ??
    c.get("privy-access-token")?.value;
  if (!token) return null;

  try {
    const claims = await client.verifyAuthToken(token);
    return claims.userId ?? null;
  } catch {
    return null;
  }
}

export function isPrivyConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET,
  );
}
