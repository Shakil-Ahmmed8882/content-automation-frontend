import type React from "react";
import type { HTMLAttributes, ReactNode } from "react";

// ---------- TYPES ----------
export type Tab = { id: string; value: string; icon?: ReactNode };

export type TabsContextType = {
  activeTabs: string[]; // always array of IDs
  setActiveTabs: React.Dispatch<React.SetStateAction<string[]>>;
  multiple: boolean;
  valueAs?: "id" | "value";
};

export type TabsProviderProps = {
  children: ReactNode;
  setActiveTabs?: React.Dispatch<React.SetStateAction<string[]>>;
  multiple?: boolean;
  activeTabs?: string[];
  defaultActive?: string | string[];
  valueAs?: "id" | "value";
};

export type TabsProps = {
  multiple?: boolean;
  loading?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export interface TabsItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  tab: Tab;
  onClick?: (newActiveTabs: string[]) => void; // Always array
  className?: string;
}
