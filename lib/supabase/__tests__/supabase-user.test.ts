import { ensureUserAndProfile, mapProvider } from "@/lib/supabase/user";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type MockClient = Pick<SupabaseClient<Database>, "from">;

const baseUser: User = {
  id: "00000000-0000-0000-0000-000000000001",
  app_metadata: { provider: "google" },
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  email: "test@example.com",
  factors: [],
  identities: [],
  phone: "",
  role: "authenticated",
};

function createMockClient() {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const from = jest.fn().mockReturnValue({ upsert });
  return { client: { from } as unknown as MockClient, upsert, from };
}

describe("mapProvider", () => {
  it("maps google provider", () => {
    expect(mapProvider("google")).toBe("google");
  });

  it("maps email/unknown providers to email_magic_link", () => {
    expect(mapProvider("email")).toBe("email_magic_link");
    expect(mapProvider(undefined)).toBe("email_magic_link");
  });
});

describe("ensureUserAndProfile", () => {
  it("upserts user and profile records", async () => {
    const { client, upsert } = createMockClient();

    await ensureUserAndProfile(client, baseUser);

    expect(upsert).toHaveBeenCalledTimes(2);
    // First upsert targets users
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: baseUser.id,
        email: baseUser.email,
        auth_provider: "google",
      }),
      expect.any(Object)
    );
    // Second upsert targets profiles
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: baseUser.id,
      }),
      expect.any(Object)
    );
  });

  it("no-ops when auth user missing", async () => {
    const { client, upsert } = createMockClient();
    await ensureUserAndProfile(client, null);
    expect(upsert).not.toHaveBeenCalled();
  });
});
