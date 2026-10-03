import type { ReactNode } from "react";

type ShowIfProps = {
  condition: boolean;
  children: ReactNode;
};

export function ShowIf({ condition, children }: ShowIfProps) {
  if (!condition) return null;
  return <>{children}</>;
}
