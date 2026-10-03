import type { ReactNode } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type BaseAvatarProps = {
  src?: string | null;
  name?: string;
  alt?: string;
  size?: AvatarSize;
  isLoading?: boolean;
  className?: string;
  tooltip?: boolean;
  ring?: boolean;
  /**
   * Background/text tone of the initials fallback (shown when there is no image
   * or it fails to load). "muted" (default) = neutral grey. "primary" = a soft
   * primary-tinted chip with the primary-colored initial — so a missing avatar
   * still reads as a clean, branded placeholder rather than a broken image.
   */
  fallbackTone?: "muted" | "primary";
  /**
   * How many initials to show in the fallback. Defaults to all words' initials;
   * pass 1 to show only the first letter.
   */
  initialsCount?: number;
};

export type GroupAvatarUser = {
  src?: string | null;
  name?: string;
  id?: string | number;
};

export type GroupAvatarsProps = {
  users: GroupAvatarUser[];
  maxCount?: number;
  size?: AvatarSize;
  isLoading?: boolean;
  className?: string;
  tooltip?: boolean;
  overflowContent?: (remaining: number) => ReactNode;
  /**
   * Merged onto every visible avatar. Opt-in because `BaseAvatar` hardcodes a
   * solid `ring-primary`, which several dashboard frames draw as a light hairline
   * instead — this lets a caller restyle the ring without changing that default
   * for every avatar in the app.
   */
  avatarClassName?: string;
  /**
   * Merged onto the "+N" overflow chip. Opt-in for the same reason: the chip's
   * own colours are pre-rebrand hex literals (see the brand-migration note in
   * the design system), so a caller that needs the tokenised treatment passes it here
   * rather than editing the shared default.
   */
  overflowClassName?: string;
};

export type ActiveInactiveAvatarProps = BaseAvatarProps & {
  status?: "active" | "inactive";
  showStatus?: boolean;
};
