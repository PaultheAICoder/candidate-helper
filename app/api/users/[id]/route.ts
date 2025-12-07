import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { deleteUserData } from "@/lib/utils/data-delete";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = createServiceRoleClient();

    // Delete user-owned data
    await deleteUserData(service, user.id);

    // Remove auth user
    const { error: authError } = await service.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error("Auth deletion error:", authError);
      return NextResponse.json({ error: "Failed to delete auth user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
