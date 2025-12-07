import { signDigestToken, verifyDigestToken } from "@/lib/utils/digest-tokens";

describe("digest tokens", () => {
  it("signs and verifies tokens", () => {
    const token = signDigestToken({ userId: "user-1", action: "confirm" });
    const result = verifyDigestToken(token);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe("user-1");
    expect(result.action).toBe("confirm");
  });

  it("rejects tampered tokens", () => {
    const token = signDigestToken({ userId: "user-1", action: "confirm" });
    const parts = token.split(".");
    const tampered = `${parts[0]}.bad`;
    const result = verifyDigestToken(tampered);
    expect(result.valid).toBe(false);
  });
});
