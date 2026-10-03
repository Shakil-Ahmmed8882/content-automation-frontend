import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Page } from "../MultipageModal";
import type { MultipageModalPageProps } from "../types";

/**
 * params:
 * - children: all modal pages (may be deeply nested inside wrapper components)
 * - currentPageId: id of the page that should be shown now
 *
 * what we do with it:
 * - recursively walk the React element tree
 * - keep only <MultipageModal.Page /> components
 * - find the one whose id matches currentPageId
 *
 * what we return:
 * - the matched page to render
 * - or undefined if nothing matches
 *
 * why recursive:
 * - pages may be wrapped in a context provider or other non-DOM wrapper
 *   components (e.g. a shared-state provider) that sit between <MultipageModal>
 *   and the actual <MultipageModal.Page> nodes.
 */
export function getActivePage(
  children: ReactNode,
  currentPageId: string | null,
): ReactElement<MultipageModalPageProps> | undefined {
  let found: ReactElement<MultipageModalPageProps> | undefined;

  Children.forEach(children, (child) => {
    if (found) return; // already found, short-circuit

    if (!isValidElement<MultipageModalPageProps>(child)) return;

    // Exact match: this node is a Page with the right id
    if (child.type === Page) {
      const props = child.props as MultipageModalPageProps;
      if (props.id === currentPageId) {
        found = child;
      }
      return; // never recurse into a Page's own children
    }

    // Not a Page — recurse into this element's children if present
    const nestedChildren = (child.props as { children?: ReactNode }).children;
    if (nestedChildren) {
      found = getActivePage(nestedChildren, currentPageId);
    }
  });

  return found;
}
