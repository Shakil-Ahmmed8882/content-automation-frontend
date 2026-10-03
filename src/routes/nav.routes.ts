import {
  Crown,
  LayoutDashboard,
  Link2,
  type LucideIcon,
  PenSquare,
  Shield,
  Sparkles,
  UserRound,
  Workflow,
} from "lucide-react";
import type { User } from "@/types/auth.type";
import { routes } from "./app.routes";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  visible: (user: User) => boolean;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: routes.dashboard,
    icon: LayoutDashboard,
    visible: () => true,
  },
  {
    label: "Create post",
    href: routes.create,
    icon: PenSquare,
    visible: () => true,
  },
  {
    label: "Connections",
    href: routes.connections,
    icon: Link2,
    visible: () => true,
  },
  {
    label: "Executions",
    href: routes.executions,
    icon: Workflow,
    visible: () => true,
  },
  {
    label: "Upcoming features",
    href: routes.upcomingFeatures,
    icon: Sparkles,
    visible: (user) => user.isPremium,
  },
  {
    label: "Upgrade",
    href: routes.payment,
    icon: Crown,
    visible: (user) => !user.isPremium,
  },
  {
    label: "Profile",
    href: routes.profile,
    icon: UserRound,
    visible: () => true,
  },
  {
    label: "Admin",
    href: routes.adminPlatforms,
    icon: Shield,
    visible: (user) => user.role === "ADMIN" || user.role === "SUPER_ADMIN",
  },
];

export function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
