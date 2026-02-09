import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get or create user profile
  let profile = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    profile = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split("@")[0],
        role: "ADMIN",
      },
    });
  }

  return (
    <DashboardShell userName={profile.name} userEmail={profile.email}>
      {children}
    </DashboardShell>
  );
}
