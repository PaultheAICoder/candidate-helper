import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const draftSchema = z.object({
  currentQuestionId: z.string().uuid().optional(),
  currentIndex: z.number().int().min(0).optional(),
  mode: z.enum(["audio", "text"]).optional(),
  answers: z
    .record(
      z.string().uuid(),
      z.object({
        text: z.string().max(6000).optional(),
        durationSeconds: z.number().int().min(0).max(240).optional(),
        retakeUsed: z.boolean().optional(),
        extensionUsed: z.boolean().optional(),
        isFinal: z.boolean().optional(),
      })
    )
    .optional(),
});

async function getSessionForUser(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, user_id")
    .eq("id", sessionId)
    .single();

  return { supabase, user, session, error };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, session, error } = await getSessionForUser(params.id);
  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.user_id && session.user_id !== user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error: fetchError } = await supabase
    .from("sessions")
    .select("draft_save")
    .eq("id", params.id)
    .single();

  if (fetchError) {
    console.error("Draft fetch error:", fetchError);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }

  return NextResponse.json({ draft: data?.draft_save ?? null });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft payload" }, { status: 400 });
  }

  const { supabase, user, session, error } = await getSessionForUser(params.id);
  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.user_id && session.user_id !== user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("sessions")
    .update({ draft_save: payload })
    .eq("id", params.id);

  if (updateError) {
    console.error("Draft save error:", updateError);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }

  return NextResponse.json({ success: true, draft: payload });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, session, error } = await getSessionForUser(params.id);
  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.user_id && session.user_id !== user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update({ draft_save: null })
    .eq("id", params.id);

  if (updateError) {
    console.error("Draft clear error:", updateError);
    return NextResponse.json({ error: "Failed to clear draft" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
