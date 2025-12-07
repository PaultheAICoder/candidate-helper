import { exportUserData } from "@/lib/utils/data-export";
import { deleteUserData } from "@/lib/utils/data-delete";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type MockResponse<T> = { data: T; error: null } | { data: null; error: { code: string } };

function createMockClient(tables: Record<string, MockResponse<any>>) {
  const client: Partial<SupabaseClient<Database>> = {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: string) => {
          const key = `${table}:eq:${col}:${val}`;
          const entry = tables[key] ?? tables[table];
          return {
            ...entry,
            single: () => entry,
          };
        },
        in: () => tables[table] ?? { data: [], error: null },
        single: () => tables[table] ?? { data: null, error: null },
      }),
      delete: () => ({
        eq: () => ({ error: null }),
        in: () => ({ error: null }),
      }),
    }),
  };
  return client as SupabaseClient<Database>;
}

describe("exportUserData", () => {
  it("returns aggregated data for user", async () => {
    const mock = createMockClient({
      users: { data: { id: "u1", email: "a@b.com" }, error: null },
      profiles: { data: { user_id: "u1" }, error: null },
      sessions: { data: [{ id: "s1", user_id: "u1" }], error: null },
      answers: { data: [{ id: "a1", session_id: "s1" }], error: null },
      reports: { data: [{ id: "r1", session_id: "s1" }], error: null },
      consents: { data: [{ id: "c1", user_id: "u1" }], error: null },
      events: { data: [{ id: "e1", user_id: "u1" }], error: null },
      matches: { data: [{ id: "m1", user_id: "u1" }], error: null },
    });

    const result = await exportUserData(mock, "u1");
    expect(result.user).toMatchObject({ id: "u1" });
    expect(result.sessions).toHaveLength(1);
    expect(result.answers).toHaveLength(1);
    expect(result.reports).toHaveLength(1);
    expect(result.consents).toHaveLength(1);
    expect(result.events).toHaveLength(1);
    expect(result.matches).toHaveLength(1);
  });
});

describe("deleteUserData", () => {
  it("deletes dependent tables then user", async () => {
    const deleteCalls: string[] = [];
    const mock: Partial<SupabaseClient<Database>> = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({ data: [{ id: "s1" }], error: null }),
        }),
        delete: () => ({
          eq: () => {
            deleteCalls.push(`${table}:eq`);
            return { error: null };
          },
          in: () => {
            deleteCalls.push(`${table}:in`);
            return { error: null };
          },
        }),
      }),
    };

    await deleteUserData(mock as SupabaseClient<Database>, "u1");

    expect(deleteCalls).toEqual(
      expect.arrayContaining([
        "answers:in",
        "questions:in",
        "reports:in",
        "sessions:in",
        "matches:eq",
        "events:eq",
        "consents:eq",
        "profiles:eq",
        "users:eq",
      ])
    );
  });
}
);
