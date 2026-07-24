import {
  BarChart3,
  CalendarDays,
  FileText,
  Home,
  Landmark,
  LineChart,
  PiggyBank,
  Receipt,
  Scale,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export interface NavSection {
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export type NavEntry = ({ kind: "leaf" } & NavLeaf) | ({ kind: "section" } & NavSection);

/** Single source of truth for the whole platform's navigation. Adding a
 * future module (Expenses, Goals, etc.) once it's actually built is just
 * flipping `comingSoon` off here — nothing else in the shell changes. */
export const NAV: NavEntry[] = [
  { kind: "leaf", label: "Dashboard", href: "/", icon: Home },
  {
    kind: "section",
    label: "Finance",
    icon: Wallet,
    items: [
      { label: "Loans", href: "/finance/loans", icon: Landmark },
      { label: "Expenses", href: "/finance/expenses", icon: Receipt, comingSoon: true },
      { label: "Savings", href: "/finance/savings", icon: PiggyBank, comingSoon: true },
      { label: "Investments", href: "/finance/investments", icon: TrendingUp, comingSoon: true },
      { label: "Net Worth", href: "/finance/net-worth", icon: Scale, comingSoon: true },
    ],
  },
  {
    kind: "section",
    label: "Insights",
    icon: BarChart3,
    items: [
      { label: "Analytics", href: "/insights/analytics", icon: LineChart, comingSoon: true },
      { label: "Reports", href: "/insights/reports", icon: FileText, comingSoon: true },
      { label: "Forecast", href: "/insights/forecast", icon: TrendingUp, comingSoon: true },
    ],
  },
  {
    kind: "section",
    label: "Planner",
    icon: CalendarDays,
    items: [
      { label: "Calendar", href: "/planner/calendar", icon: CalendarDays, comingSoon: true },
      { label: "Goals", href: "/planner/goals", icon: Target, comingSoon: true },
    ],
  },
  { kind: "leaf", label: "Settings", href: "/settings", icon: Settings },
];
