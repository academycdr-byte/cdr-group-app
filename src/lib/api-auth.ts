import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function getApiUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Não autorizado" },
    { status: 401 }
  );
}
