import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":***@")
        : "NOT SET",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "SET (" + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "...)"
        : "NOT SET",
    },
  };

  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = { status: "connected", result };
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const ok = (checks.database as { status: string }).status === "connected";
  return NextResponse.json(checks, { status: ok ? 200 : 500 });
}
