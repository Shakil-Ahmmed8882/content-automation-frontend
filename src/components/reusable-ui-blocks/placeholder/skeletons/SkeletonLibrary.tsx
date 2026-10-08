"use client";

import { cn } from "@/lib/utils";
import type { TCommonProps } from "@/types/global.type";

import { BaseSkeleton } from "./BaseSkeleton";

import { CardSkeletonV2List } from "./CardSkeletons";
import { ParagraphSkeleton } from "./ParagraphSkeleton";
import { TabsSkeleton } from "./TabsSkeleton";

// ============================================
// AVATAR SKELETON
// ============================================
function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  return (
    <BaseSkeleton
      className={cn(sizeClasses[size], "rounded-full flex-shrink-0")}
    />
  );
}

// ============================================
// TEXT SKELETON (Single Line)
// ============================================
export function TextSkeleton({
  width = "full",
}: {
  width?: "full" | "3/4" | "1/2" | "1/3" | "1/4";
}) {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  };
  return <BaseSkeleton className={cn("h-4", widthClasses[width])} />;
}

// ============================================
// COMMUNITY MEMBERS SKELETON
// ============================================
export const CommunityCardWithMembersSkeletonCard = () => {
  return (
    <div className="w-full bg-card rounded-xl space-y-4">
      <div className="space-y-2">
        <BaseSkeleton className="h-3 w-1/2 rounded" />{" "}
        {/* “Including Mahadi…” */}
        <BaseSkeleton className="h-3 w-full rounded" />{" "}
        {/* “Including Mahadi…” */}
      </div>

      {/* Group Avatars */}
      <GroupAvatarsSkeleton />
      {/* Button */}
      <div className="pt-2">
        <BaseSkeleton className="h-10 w-full rounded-full" />{" "}
        {/* “Show all members” */}
      </div>
    </div>
  );
};

export const GroupAvatarsSkeleton = ({
  count = 4,
  parentClass,
  childClass,
}: {
  count?: number;
  parentClass?: string;
  childClass?: string;
}) => {
  return (
    <div className={`flex items-center gap-2 mt-2 -space-x-3 ${parentClass}`}>
      {[...Array(count)].map((_, i) => (
        <BaseSkeleton
          key={i}
          className={`size-10 rounded-full ${childClass}`}
        />
      ))}
    </div>
  );
};

// ============================================
// IMAGE SKELETON
// ============================================
export function ImageSkeleton({
  aspectRatio = "video",
}: {
  aspectRatio?: "square" | "video" | "portrait" | "wide";
}) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  };
  return (
    <BaseSkeleton
      className={cn("w-full rounded-lg", aspectClasses[aspectRatio])}
    />
  );
}

// ============================================
// BUTTON SKELETON
// ============================================
function ButtonSkeleton({
  size = "md",
  fullWidth = false,
}: {
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };
  return (
    <BaseSkeleton
      className={cn(sizeClasses[size], "rounded-md", fullWidth && "w-full")}
    />
  );
}

// ============================================
// CARD SKELETON
// ============================================
export function CardSkeleton({ showImage = true }: { showImage?: boolean }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {showImage && <ImageSkeleton aspectRatio="video" />}
      <div className="space-y-2">
        <BaseSkeleton className="h-6 w-3/4" />
        <ParagraphSkeleton lines={2} />
      </div>
      <div className="flex items-center gap-2">
        <AvatarSkeleton size="sm" />
        <BaseSkeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ============================================
// GRID CARD SKELETON
// ============================================
function GridCardsSkeleton({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={cn("grid gap-4", gridClasses[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} showImage />
      ))}
    </div>
  );
}

// ============================================
// LIST ITEM SKELETON
// ============================================
function ListItemSkeleton({
  showAvatar = true,
  showAction = true,
}: {
  showAvatar?: boolean;
  showAction?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      {showAvatar && <AvatarSkeleton size="md" />}
      <div className="flex-1 space-y-2">
        <BaseSkeleton className="h-4 w-1/2" />
        <BaseSkeleton className="h-3 w-3/4" />
      </div>
      {showAction && <BaseSkeleton className="h-8 w-8 rounded-md" />}
    </div>
  );
}

// ============================================
// LIST SKELETON
// ============================================
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 my-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// TABLE SKELETON
// ============================================
function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className=" rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted p-4 ">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <BaseSkeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <BaseSkeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// FORM INPUT SKELETON
// ============================================
function InputSkeleton({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-2">
      {label && <BaseSkeleton className="h-4 w-24" />}
      <BaseSkeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

// ============================================
// FORM SKELETON
// ============================================
function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <InputSkeleton key={i} />
      ))}
      <ButtonSkeleton size="lg" fullWidth />
    </div>
  );
}

// ============================================
// NAVBAR SKELETON
// ============================================
function NavbarSkeleton() {
  return (
    <div className="bg-card border-b border-border p-4">
      <div className="container mx-auto flex items-center justify-between">
        <BaseSkeleton className="h-8 w-32" />
        <div className="hidden md:flex items-center gap-6">
          <BaseSkeleton className="h-4 w-16" />
          <BaseSkeleton className="h-4 w-16" />
          <BaseSkeleton className="h-4 w-16" />
          <BaseSkeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <BaseSkeleton className="h-9 w-9 rounded-full" />
          <AvatarSkeleton size="md" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR SKELETON
// ============================================
export function SidebarSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="!w-full bg-card border-r border-border p-4 space-y-2">
      <BaseSkeleton className="h-8 w-32 mb-6" />
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-md">
          <BaseSkeleton className="h-5 w-5" />
          <BaseSkeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// BREADCRUMB SKELETON
// ============================================
function BreadcrumbSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <BaseSkeleton className="h-4 w-20" />
          {i < items - 1 && <span className="text-muted-foreground">/</span>}
        </div>
      ))}
    </div>
  );
}

// ============================================
// STAT CARD SKELETON
// ============================================
function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-3">
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-4 w-24" />
        <BaseSkeleton className="h-5 w-5 rounded-md" />
      </div>
      <BaseSkeleton className="h-8 w-32" />
      <BaseSkeleton className="h-3 w-20" />
    </div>
  );
}

// ============================================
// STATS GRID SKELETON
// ============================================
function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// CHART SKELETON
// ============================================
function ChartSkeleton({ type = "bar" }: { type?: "bar" | "line" | "pie" }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-5 w-32" />
        <BaseSkeleton className="h-8 w-24 rounded-md" />
      </div>
      {type === "pie" ? (
        <div className="flex items-center justify-center py-8">
          <BaseSkeleton className="h-48 w-48 rounded-full" />
        </div>
      ) : (
        <div className="h-64 flex items-end justify-between gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <BaseSkeleton
              key={i}
              className="flex-1"
              // style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PROFILE HEADER SKELETON
// ============================================
function ProfileHeaderSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Cover Image */}
      <BaseSkeleton className="h-48 w-full" />
      {/* Profile Info */}
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4 -mt-16">
          <BaseSkeleton className="h-24 w-24 rounded-full border-4 border-background" />
          <div className="flex-1 mt-16 space-y-2">
            <BaseSkeleton className="h-6 w-48" />
            <BaseSkeleton className="h-4 w-32" />
          </div>
          <ButtonSkeleton size="md" />
        </div>
        <ParagraphSkeleton lines={2} />
        <div className="flex items-center gap-6">
          <BaseSkeleton className="h-4 w-24" />
          <BaseSkeleton className="h-4 w-24" />
          <BaseSkeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SOCIAL MEDIA POST SKELETON
// ============================================
export function PostSkeleton({
  variant = "standard",
  showImage = true,
  showComment = false,
}: {
  variant?: "standard" | "business" | "marketplace";
  showImage?: boolean;
  showComment?: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AvatarSkeleton size="lg" />
        <div className="flex-1 space-y-2">
          <BaseSkeleton className="h-4 w-32 md:w-40" />
          <BaseSkeleton className="h-3 w-20 md:w-24" />
        </div>
        <BaseSkeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content */}
      <ParagraphSkeleton lines={variant === "standard" ? 3 : 2} />

      {/* Business Badge */}
      {variant === "business" && (
        <div className="flex items-center gap-2">
          <BaseSkeleton className="h-5 w-20" />
          <BaseSkeleton className="h-5 w-24" />
        </div>
      )}

      {/* Marketplace Price */}
      {variant === "marketplace" && (
        <div className="flex items-center justify-between">
          <BaseSkeleton className="h-6 w-24" />
          <BaseSkeleton className="h-5 w-20" />
        </div>
      )}

      {/* Image */}
      {showImage && <ImageSkeleton aspectRatio="video" />}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <BaseSkeleton className="h-5 w-5 rounded-full" />
            <BaseSkeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <BaseSkeleton className="h-5 w-5 rounded-full" />
            <BaseSkeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <BaseSkeleton className="h-5 w-5 rounded-full" />
            <BaseSkeleton className="h-4 w-8" />
          </div>
        </div>
        <BaseSkeleton className="h-5 w-5 rounded-full" />
      </div>

      {showComment && (
        <div className="space-y-10 pt-6">
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      )}
    </div>
  );
}

// ============================================
// COMMENT SKELETON
// ============================================
function CommentSkeleton({ isReply = false }: { isReply?: boolean }) {
  return (
    <div className={cn("flex gap-3", isReply && "ml-8 md:ml-12")}>
      <AvatarSkeleton size="md" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted rounded-2xl p-3 space-y-2">
          <BaseSkeleton className="h-3 w-24 md:w-32" />
          <ParagraphSkeleton lines={2} />
        </div>
        <div className="flex items-center gap-4 px-3">
          <BaseSkeleton className="h-3 w-12" />
          <BaseSkeleton className="h-3 w-12" />
          <BaseSkeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATION SKELETON
// ============================================
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50">
      <AvatarSkeleton size="md" />
      <div className="flex-1 space-y-2">
        <ParagraphSkeleton lines={2} />
        <BaseSkeleton className="h-3 w-16" />
      </div>
      <BaseSkeleton className="h-2 w-2 rounded-full" />
    </div>
  );
}

// ============================================
// NOTIFICATION LIST SKELETON
// ============================================
function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <BaseSkeleton className="h-5 w-32" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// STORY SKELETON
// ============================================
function StorySkeleton() {
  return (
    <div className="flex-shrink-0 w-24 space-y-2">
      <BaseSkeleton className="h-24 w-24 rounded-xl" />
      <BaseSkeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}

// ============================================
// STORIES ROW SKELETON
// ============================================
function StoriesRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: count }).map((_, i) => (
          <StorySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CHAT MESSAGE SKELETON
// ============================================
function ChatMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      {!isOwn && <AvatarSkeleton size="sm" />}
      <div
        className={cn(
          "space-y-1",
          isOwn ? "items-end" : "items-start",
          "flex flex-col",
        )}
      >
        <BaseSkeleton
          className={cn(
            "h-12 w-48 rounded-2xl",
            isOwn ? "rounded-tr-sm" : "rounded-tl-sm",
          )}
        />
        <BaseSkeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// ============================================
// CHAT CONVERSATION SKELETON
// ============================================
function ChatConversationSkeleton({ messages = 6 }: { messages?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: messages }).map((_, i) => (
        <ChatMessageSkeleton key={i} isOwn={i % 3 === 0} />
      ))}
    </div>
  );
}

// ============================================
// PRODUCT CARD SKELETON
// ============================================
function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <ImageSkeleton aspectRatio="square" />
      <div className="p-4 space-y-3">
        <BaseSkeleton className="h-5 w-3/4" />
        <ParagraphSkeleton lines={2} />
        <div className="flex items-center justify-between">
          <BaseSkeleton className="h-6 w-20" />
          <BaseSkeleton className="h-4 w-16" />
        </div>
        <ButtonSkeleton size="md" fullWidth />
      </div>
    </div>
  );
}

// ============================================
// PRODUCT GRID SKELETON
// ============================================
function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// SEARCH BAR SKELETON
// ============================================
function SearchBarSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <BaseSkeleton className="h-10 flex-1 rounded-full" />
      <BaseSkeleton className="h-10 w-10 rounded-full" />
    </div>
  );
}

// ============================================
// PAGINATION SKELETON
// ============================================
function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-center gap-2">
      <BaseSkeleton className="h-9 w-9 rounded-md" />
      <BaseSkeleton className="h-9 w-9 rounded-md" />
      <BaseSkeleton className="h-9 w-9 rounded-md" />
      <BaseSkeleton className="h-9 w-9 rounded-md" />
      <BaseSkeleton className="h-9 w-9 rounded-md" />
    </div>
  );
}

// ============================================
// ACCORDION SKELETON
// ============================================
function AccordionSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <BaseSkeleton className="h-5 w-48" />
            <BaseSkeleton className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MODAL SKELETON
// ============================================
function ModalSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-6 w-48" />
        <BaseSkeleton className="h-6 w-6 rounded-md" />
      </div>
      <ParagraphSkeleton lines={4} />
      <div className="flex items-center gap-3 justify-end">
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
      </div>
    </div>
  );
}

// ============================================
// CALENDAR SKELETON
// ============================================
function CalendarSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <BaseSkeleton className="h-8 w-8 rounded-md" />
          <BaseSkeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <BaseSkeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// VIDEO PLAYER SKELETON
// ============================================
function VideoPlayerSkeleton() {
  return (
    <div className="relative bg-card rounded-lg border border-border overflow-hidden">
      <BaseSkeleton className="aspect-video w-full" />
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        <BaseSkeleton className="h-1 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BaseSkeleton className="h-8 w-8 rounded-full" />
            <BaseSkeleton className="h-8 w-8 rounded-full" />
            <BaseSkeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <BaseSkeleton className="h-8 w-8 rounded-full" />
            <BaseSkeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DEMO PAGE - Shows all skeletons
// ============================================
export default function SkeletonLibrary() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Complete Skeleton Library</h1>
          <p className="text-muted-foreground">
            Copy any skeleton component below and use it in your app. Each
            section is clearly labeled.
          </p>
        </div>

        {/* CARDS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">CARDS</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Card Skeleton</h3>
              <div className="max-w-sm">
                <CardSkeleton showImage />
              </div>
            </div>
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b pb-2">CARD V2</h2>
            </section>
            <CardSkeletonV2List />
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Grid Cards Skeleton
              </h3>
              <GridCardsSkeleton count={6} columns={3} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Stat Card Skeleton</h3>
              <StatsGridSkeleton count={4} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Product Card Skeleton
              </h3>
              <div className="max-w-xs">
                <ProductCardSkeleton />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/*             TEXT SKELETON LIST */}
        {/* ================================================== */}
        <div>
          <h3 className="text-lg font-semibold mb-3">TEXT SKELETON</h3>
          <TextSkeleton />
        </div>

        {/* LISTS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">LISTS</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">List Skeleton</h3>
              <ListSkeleton count={5} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Notification List Skeleton
              </h3>
              <NotificationListSkeleton count={4} />
            </div>
          </div>
        </section>

        {/* NAVIGATION */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">NAVIGATION</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Navbar Skeleton</h3>
              <NavbarSkeleton />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Sidebar Skeleton</h3>
              <div className="h-96 overflow-hidden rounded-lg border">
                <SidebarSkeleton items={8} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Tabs Skeleton</h3>
              <TabsSkeleton count={4} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Breadcrumb Skeleton
              </h3>
              <div className="p-4 bg-card rounded-lg border">
                <BreadcrumbSkeleton items={4} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Pagination Skeleton
              </h3>
              <div className="p-4 bg-card rounded-lg border">
                <PaginationSkeleton />
              </div>
            </div>
          </div>
        </section>

        {/* FORMS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">FORMS</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Input Skeleton</h3>
              <div className="max-w-md">
                <InputSkeleton />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Form Skeleton</h3>
              <div className="max-w-md">
                <FormSkeleton fields={5} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Search Bar Skeleton
              </h3>
              <SearchBarSkeleton />
            </div>
          </div>
        </section>

        {/* DATA DISPLAY */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">DATA DISPLAY</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Table Skeleton</h3>
              <TableSkeleton rows={5} columns={4} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Chart Skeleton (Bar)
              </h3>
              <ChartSkeleton type="bar" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Chart Skeleton (Pie)
              </h3>
              <div className="max-w-md">
                <ChartSkeleton type="pie" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Accordion Skeleton</h3>
              <AccordionSkeleton items={4} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Calendar Skeleton</h3>
              <div className="max-w-md">
                <CalendarSkeleton />
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL MEDIA */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">SOCIAL MEDIA</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Post Skeleton (Standard)
              </h3>
              <div className="max-w-2xl">
                <PostSkeleton variant="standard" showImage />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Post Skeleton (Business)
              </h3>
              <div className="max-w-2xl">
                <PostSkeleton variant="business" showImage />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Post Skeleton (Marketplace)
              </h3>
              <div className="max-w-2xl">
                <PostSkeleton variant="marketplace" showImage />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Comment Skeleton</h3>
              <div className="max-w-2xl space-y-4">
                <CommentSkeleton />
                <CommentSkeleton isReply />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Profile Header Skeleton
              </h3>
              <div className="max-w-3xl">
                <ProfileHeaderSkeleton />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Stories Row Skeleton
              </h3>
              <StoriesRowSkeleton count={8} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Chat Conversation Skeleton
              </h3>
              <div className="max-w-2xl">
                <ChatConversationSkeleton messages={6} />
              </div>
            </div>
          </div>
        </section>

        {/* MEDIA */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">MEDIA</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Video Player Skeleton
              </h3>
              <div className="max-w-3xl">
                <VideoPlayerSkeleton />
              </div>
            </div>
          </div>
        </section>

        {/* OVERLAYS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">OVERLAYS</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Modal Skeleton</h3>
              <ModalSkeleton />
            </div>
          </div>
        </section>

        {/* E-COMMERCE */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">E-COMMERCE</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Product Grid Skeleton
              </h3>
              <ProductGridSkeleton count={8} />
            </div>
          </div>
        </section>
        {/* Side bar  */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b pb-2">Sidebar </h2>
          <SidebarSkeletonLayout />
        </section>
      </div>
    </main>
  );
}

export const SingleCommunitySkeleton = ({ className }: TCommonProps) => {
  return (
    <div
      className={`${className} flex items-center gap-3  p-3 hover:bg-muted/50 !rounded-[8px] border border-border`}
    >
      {/* Avatar */}
      <BaseSkeleton className="size-14 rounded-full flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 w-full space-y-2">
        <BaseSkeleton className="h-4 w-24" />
        <BaseSkeleton className="h-3 w-full" />
      </div>
    </div>
  );
};

export const CommunitiesSkeletonList = ({ count = 5 }) => {
  return (
    <>
      {/* Featured Communities */}
      <div className="space-y-5 mt-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3  p-3 hover:bg-muted/50 !rounded-[8px] border border-border"
          >
            {/* Avatar */}
            <BaseSkeleton className="size-14 rounded-full flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0 w-full space-y-2">
              <BaseSkeleton className="h-4 w-24" />
              <BaseSkeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export function SidebarSkeletonLayout() {
  return (
    <div className="w-full max-w-sm space-y-6 p-4 border">
      {/* Header Section - Communities/Organizations */}
      <div className="space-y-3">
        {/* Section Title */}
        <div className="px-2 py-1">
          <BaseSkeleton className="h-5 w-32" />
        </div>

        {/* Featured Communities - Top 3 items */}
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
            >
              {/* Avatar */}
              <BaseSkeleton className="h-10 w-10 rounded-full flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <BaseSkeleton className="h-4 w-24" />
                <BaseSkeleton className="h-3 w-40" />
              </div>

              {/* Status Button */}
              <BaseSkeleton className="h-7 w-16 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Suggested Communities Section */}
      <div className="space-y-3">
        {/* Section Title */}
        <div className="px-2 py-1">
          <BaseSkeleton className="h-5 w-40" />
        </div>

        {/* Community Items - 4 items */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
            >
              {/* Avatar */}
              <BaseSkeleton className="h-10 w-10 rounded-full flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <BaseSkeleton className="h-4 w-32" />
                <BaseSkeleton className="h-3 w-48" />
              </div>

              {/* Status Button */}
              <BaseSkeleton className="h-7 w-16 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* My Friends Section */}
      <div className="space-y-3">
        {/* Section Header with View All */}
        <div className="flex items-center justify-between px-2">
          <BaseSkeleton className="h-5 w-24" />
          <BaseSkeleton className="h-4 w-16" />
        </div>

        {/* Friend Cards - 4 items */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="rounded-lg  p-3 space-y-2">
              {/* Friend Header */}
              <div className="flex items-center gap-2">
                <BaseSkeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <BaseSkeleton className="h-3 w-20" />
                  <BaseSkeleton className="h-2 w-32" />
                </div>
              </div>

              {/* Friend Stats/Description */}
              <BaseSkeleton className="h-3 w-full" />

              {/* Action Button */}
              <BaseSkeleton className="h-7 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Featured Friends Section */}
      <div className="space-y-3">
        {/* Section Header */}
        <div className="px-2">
          <BaseSkeleton className="h-5 w-36" />
        </div>

        {/* Featured Friend Cards - 2 items */}
        <div className="space-y-2">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-lg  p-3 space-y-2">
              {/* Friend Header */}
              <div className="flex items-center gap-2">
                <BaseSkeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <BaseSkeleton className="h-3 w-20" />
                  <BaseSkeleton className="h-2 w-32" />
                </div>
              </div>

              {/* Action Button */}
              <BaseSkeleton className="h-7 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================
// import { BaseSkeleton } from "./BaseSkeleton";

export function SingleCardSkeleton() {
  return (
    <div className="w-full  rounded-xl shadow-card border border-border p-4 space-y-4">
      {/* Image */}
      <BaseSkeleton className="h-40 w-full rounded-lg" />

      {/* Title */}
      <BaseSkeleton className="h-5  w-3/4" />

      {/* Subtitle */}
      <BaseSkeleton className="h-4 w-1/2" />

      {/* Description lines */}
      <div className="space-y-2">
        <BaseSkeleton className="h-3 w-full" />
        <BaseSkeleton className="h-3 w-5/6" />
      </div>

      {/* Button */}
      <BaseSkeleton className="h-10 w-1/3 rounded-md" />
    </div>
  );
}

export function HorizontalReelSkeleton() {
  return (
    <div className="relative w-[140px] md:w-[150px] h-[230px] md:h-[240px] overflow-hidden flex-shrink-0 rounded-[12px]">
      {/* Main background shape */}
      <BaseSkeleton className="w-full h-full rounded-[8px]" />

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <BaseSkeleton className="rounded-full w-12 h-12" />
      </div>

      {/* View count badge */}
      <div className="absolute top-4 right-3  rounded-full flex items-center gap-1">
        <BaseSkeleton className="w-7 h-7 bg-card rounded-full" />
      </div>

      {/* Profile avatar at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <BaseSkeleton className=" size-10 md:size-12 rounded-full bg-card border-2 border-card" />
      </div>
    </div>
  );
}

export function HorizontalReelsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-hidden ml-2">
      {Array.from({ length: count }).map((_, i) => (
        <HorizontalReelSkeleton key={i} />
      ))}
    </div>
  );
}
