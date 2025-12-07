import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyDigestToken } from "@/lib/utils/digest-tokens";

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const verification = verifyDigestToken(params.token);
    if (!verification.valid || verification.action !== "unsubscribe" || !verification.userId) {
      return NextResponse.redirect(new URL("/dashboard?digest=invalid", request.url));
    }

    const service = createServiceRoleClient();
    await service
      .from("users")
      .update({ digest_opt_in: false, digest_confirmed: false })
      .eq("id", verification.userId);

    return NextResponse.redirect(new URL("/dashboard?digest=unsubscribed", request.url));
  } catch (error) {
    console.error("Digest unsubscribe error:", error);
    return NextResponse.redirect(new URL("/dashboard?digest=error", request.url));
  }
}
