import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Page } from "../Drawer";
import type { DrawerPageProps } from "../types";

/**
 * Recursively walks the drawer's children and returns the single
 * <Drawer.Page> whose id matches `currentPageId`, or undefined if none match.
 *
 * Recursion matters because pages may be wrapped in a context provider or other
 * non-DOM wrapper between <Drawer> and the actual <Drawer.Page> nodes.
 */
export function getActiveDrawerPage(
  children: ReactNode,
  currentPageId: string | null,
): ReactElement<DrawerPageProps> | undefined {
  let found: ReactElement<DrawerPageProps> | undefined;

  Children.forEach(children, (child) => {
    if (found) return;
    if (!isValidElement<DrawerPageProps>(child)) return;

    if (child.type === Page) {
      const props = child.props as DrawerPageProps;
      if (props.id === currentPageId) found = child;
      return; // never recurse into a Page's own children
    }

    const nestedChildren = (child.props as { children?: ReactNode }).children;
    if (nestedChildren) {
      found = getActiveDrawerPage(nestedChildren, currentPageId);
    }
  });

  return found;
}
