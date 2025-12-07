import crypto from "crypto";

const SECRET = process.env.DIGEST_TOKEN_SECRET || "dev-secret";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signDigestToken(payload: { userId: string; action: "confirm" | "unsubscribe" }) {
  const exp = Date.now() + 1000 * 60 * 60 * 24; // 24h
  const body = JSON.stringify({ ...payload, exp });
  const bodyB64 = base64url(Buffer.from(body, "utf8"));
  const sig = base64url(crypto.createHmac("sha256", SECRET).update(bodyB64).digest());
  return `${bodyB64}.${sig}`;
}

export function verifyDigestToken(token: string): { valid: boolean; userId?: string; action?: string } {
  const [bodyB64, sig] = token.split(".");
  if (!bodyB64 || !sig) return { valid: false };

  const expectedSig = base64url(crypto.createHmac("sha256", SECRET).update(bodyB64).digest());
  if (expectedSig !== sig) return { valid: false };

  try {
    const decoded = JSON.parse(Buffer.from(bodyB64, "base64").toString("utf8")) as {
      userId: string;
      action: "confirm" | "unsubscribe";
      exp: number;
    };
    if (Date.now() > decoded.exp) return { valid: false };
    return { valid: true, userId: decoded.userId, action: decoded.action };
  } catch {
    return { valid: false };
  }
}
