"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export function DashboardShell({
  children,
  userName,
  userEmail,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-60 transition-all duration-300">
        <Header userName={userName} userEmail={userEmail} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
