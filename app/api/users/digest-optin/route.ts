import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signDigestToken } from "@/lib/utils/digest-tokens";
import { sendEmail } from "@/lib/email/send";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark opt-in pending confirmation
    const { error } = await supabase
      .from("users")
      .update({ digest_opt_in: true, digest_confirmed: false })
      .eq("id", user.id);

    if (error) {
      console.error("Digest opt-in error:", error);
      return NextResponse.json({ error: "Failed to update digest preference" }, { status: 500 });
    }

    const token = signDigestToken({ userId: user.id, action: "confirm" });
    const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/users/digest-confirm/${token}`;
    const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/users/digest-unsubscribe/${token}`;

    await sendEmail({
      to: user.email ?? "",
      subject: "Confirm your Cindy job digest subscription",
      html: `<p>Click to confirm: <a href="${confirmLink}">${confirmLink}</a></p><p>Unsubscribe: <a href="${unsubscribeLink}">${unsubscribeLink}</a></p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in POST /api/users/digest-optin:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
