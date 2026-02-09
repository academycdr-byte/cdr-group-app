import type {
  Role,
  ClientStatus,
  EcommercePlatform,
  InvoiceStatus,
  ExpenseStatus,
  ExpenseCategory,
  LeadStage,
  LeadSource,
  TaskPriority,
  TaskStatus,
  TeamMemberRole,
  RemunerationType,
} from "@prisma/client";

export type {
  Role,
  ClientStatus,
  EcommercePlatform,
  InvoiceStatus,
  ExpenseStatus,
  ExpenseCategory,
  LeadStage,
  LeadSource,
  TaskPriority,
  TaskStatus,
  TeamMemberRole,
  RemunerationType,
};

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  isActive: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}
