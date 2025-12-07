import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyDigestToken } from "@/lib/utils/digest-tokens";

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const verification = verifyDigestToken(params.token);
    if (!verification.valid || verification.action !== "confirm" || !verification.userId) {
      return NextResponse.redirect(new URL("/dashboard?digest=invalid", request.url));
    }

    const service = createServiceRoleClient();
    await service
      .from("users")
      .update({ digest_confirmed: true, digest_opt_in: true })
      .eq("id", verification.userId);

    return NextResponse.redirect(new URL("/dashboard?digest=confirmed", request.url));
  } catch (error) {
    console.error("Digest confirm error:", error);
    return NextResponse.redirect(new URL("/dashboard?digest=error", request.url));
  }
}
