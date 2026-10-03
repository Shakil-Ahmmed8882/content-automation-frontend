# Infinite Scroll — Reusable Module

Reusable infinite-scroll pagination for any list/grid backed by a TanStack Query
`useInfiniteQuery`. Ported from the `inhouse-vendor` project's design system
(`components/inhouse/pagination/infinite-scroll/`), adapted to this project's
`shared-context` and `ShowIf` primitives.

This module is **UI-agnostic and not wired into any page**. It only provides the
provider + renderer + observer plumbing. Wrap whatever list/grid component you
already have with it.

---

## What's in this folder

```
infinite-scroll/
├── provider/
│   ├── types.ts                          — InfiniteScrollQuery shape
│   ├── useInfiniteScrollObserver.ts       — IntersectionObserver hook (the actual "scroll" detection)
│   ├── useInfiniteScrollContextHelper.tsx — wires the query to the observer
│   └── InfiniteScrollProvider.tsx         — context provider + `useInfiniteScrollSelector`
├── ui/
│   └── InfiniteScrollRenderer.tsx         — renders children + optional skeleton + sentinel
└── docs/
    └── README.md                          — this file
```

You will only ever import two things from outside this folder:

```ts
import { InfiniteScrollProvider } from "@/components/reusable-ui-blocks/pagination/infinite-scroll/provider/InfiniteScrollProvider";
import { InfiniteScrollRenderer } from "@/components/reusable-ui-blocks/pagination/infinite-scroll/ui/InfiniteScrollRenderer";
```

Everything else (`useInfiniteScrollObserver`, `useInfiniteScrollContextHelper`, `types.ts`) is
internal plumbing — you don't import those directly in a page/module.

---

## How it works, conceptually

1. **You already have a `useInfiniteQuery`** in your module (see step 1 below). It gives you
   `fetchNextPage`, `hasNextPage`, `isFetchingNextPage`, and `data.pages`.
2. **`InfiniteScrollProvider`** takes that whole query object as a prop, and internally sets up an
   `IntersectionObserver` watching an invisible sentinel `<div>`.
3. **`InfiniteScrollRenderer`** renders your list/grid (`children`), an optional skeleton
   (`paginationSkeleton`) shown only while the next page is loading, and the sentinel `<div>` itself
   at the very bottom.
4. When the sentinel scrolls into view (within 100px, so it fires slightly before the user hits the
   literal bottom), the observer calls `fetchNextPage()` automatically — no button, no manual
   "Load more" click, no scroll-event listeners you have to write yourself.
5. The observer **automatically stops watching** once `hasNextPage` is `false` or while a fetch is
   already `isFetchingNextPage` — you don't need to guard against double-fetches or fetching past
   the last page yourself.

`paginationSkeleton` is optional. If you don't pass it, no loading indicator is shown while the next
page loads — the sentinel is still there and pagination still works, you just get no visible skeleton
under the list ("automatic callback" with a silent fetch, as opposed to giving the user a shimmer).

---

## Step-by-step: wiring up a new list

### Step 1 — your React Query hook must be a `useInfiniteQuery`, not `useQuery`

This project already has a real example at
`src/modules/leave-management/hooks/useLeaveRequestsInfinite.ts`:

```ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getLeaveRequestsPage, type GetLeaveRequestsParams } from "../services/getLeaveRequests";
import { LEAVE_REQUESTS_QUERY_KEY } from "../constants";

export function useLeaveRequestsInfinite(
	params: GetLeaveRequestsParams,
	queryKeySuffix: string | (string | number)[],
) {
	return useInfiniteQuery({
		queryKey: [LEAVE_REQUESTS_QUERY_KEY, params.hotel_id, queryKeySuffix, params],
		queryFn: ({ pageParam }) => getLeaveRequestsPage(params, pageParam),
		getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
		initialPageParam: 1,
		enabled: params.hotel_id > 0,
	});
}
```

The three fields that matter for this module come free from `useInfiniteQuery` — you don't add
anything extra to make a query "infinite-scroll compatible":

- `fetchNextPage` — what the observer calls when the sentinel is intersected.
- `hasNextPage` — derived automatically from your `getNextPageParam` returning `undefined` at the
  last page.
- `isFetchingNextPage` — `true` only while fetching page 2+ (not the initial load).

**`getNextPageParam` is the one piece you write per-endpoint** — it tells React Query what the "next
page" value is, based on the last page's response. In the `inhouse-vendor` reference
(`getVendorBids`), the backend returns `current_page`/`last_page`, so it looks like:

```ts
getNextPageParam: ({ current_page, last_page }) =>
	current_page < last_page ? current_page + 1 : undefined,
```

Whatever shape your backend's pagination meta takes, the rule is the same: return the next page
token/number, or `undefined` when there's nothing left.

### Step 2 — flatten `data.pages` into a single array

`useInfiniteQuery` gives you `data.pages`, an array of page responses — not a flat array of items.
Flatten it once, wherever you consume it:

```tsx
const query = useLeaveRequestsInfinite(params, "history");
const items = query.data?.pages.flatMap((page) => page.data) ?? [];
```

This flattened `items` array is what you pass to your grid/list component — the infinite-scroll
module itself never touches `data.pages`, that's your module's concern.

### Step 3 — wrap your list with the provider + renderer

```tsx
import { InfiniteScrollProvider } from "@/components/reusable-ui-blocks/pagination/infinite-scroll/provider/InfiniteScrollProvider";
import { InfiniteScrollRenderer } from "@/components/reusable-ui-blocks/pagination/infinite-scroll/ui/InfiniteScrollRenderer";

export function LeaveHistoryList() {
	const query = useLeaveRequestsInfinite(params, "history");
	const items = query.data?.pages.flatMap((page) => page.data) ?? [];

	return (
		<InfiniteScrollProvider query={query}>
			<InfiniteScrollRenderer paginationSkeleton={<LeaveHistorySkeleton length={3} />}>
				<LeaveHistoryGrid items={items} />
			</InfiniteScrollRenderer>
		</InfiniteScrollProvider>
	);
}
```

- **`InfiniteScrollProvider`** — pass the *entire* query object as the `query` prop. Don't
  destructure it yourself; the provider reads `fetchNextPage`/`hasNextPage`/`isFetchingNextPage` off
  it directly.
- **`InfiniteScrollRenderer`** — wraps your already-rendered list (`children`). Pass
  `paginationSkeleton` if you want a shimmer/placeholder shown under the list while the next page
  loads. Omit it if you don't need one — pagination still works, just silently.

That's it. No manual scroll listeners, no "Load More" button, no tracking of page numbers in local
state.

### ⚠️ `paginationSkeleton`'s item count must match your grid's column count

This is the single most common mistake when wiring this module up. `paginationSkeleton` renders below
the already-loaded items while the *next* page fetches — it should read as **one row**, not another
full screen of loading placeholders. That means its item count must equal your grid's own column count
at its widest active breakpoint, and it is almost always a *different* count than whatever you pass to
your initial-load skeleton (which correctly renders many items — 6, 9, whatever fills the first
screen).

```tsx
// Grid is `grid-cols-1 md:grid-cols-2` → widest is 2 columns.
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">{items.map(...)}</div>

<InfiniteScrollRenderer paginationSkeleton={<ItemSkeleton count={2} />}>  {/* ✅ one row */}
<InfiniteScrollRenderer paginationSkeleton={<ItemSkeleton />}>            {/* ❌ if ItemSkeleton
                                                                                  defaults to 6+, this
                                                                                  renders 3 rows every
                                                                                  time you scroll */}
```

If your skeleton component doesn't already accept a `count` (or `length`) prop — including if it's a
shared skeleton reused by more than one page with different grid widths — add one (default to whatever
the initial-load count already was, so you don't have to touch existing call sites), thread it through
every wrapper layer, and pass the correct value explicitly at each page's `paginationSkeleton` call
site. Never rely on a skeleton's default for this — that default is tuned for the initial full-screen
load, not a one-row pagination indicator.

### What you get for free

- Handles the initial-load case correctly (renderer's skeleton only shows for `isFetchingNextPage`,
  never for the *first* page — pair this with your own `CustomSuspense`/loading wrapper for the
  initial load, same as the `inhouse-vendor` reference does).
- No double-fetch race: the observer disconnects and reconnects on every render based on current
  `hasMore`/`isFetching`, so it physically cannot fire while a fetch is in flight or after the last
  page.
- Works with any list/grid shape — the module has no opinion on how `children` looks.

### What you still own

- Writing the `useInfiniteQuery` hook and its `getNextPageParam` per endpoint (Step 1).
- Flattening `data.pages` (Step 2) — the module doesn't do this for you, on purpose, since different
  endpoints nest their data differently.
- The initial-loading skeleton/spinner (before any page has loaded) — that's a separate concern from
  `paginationSkeleton`, which is only for subsequent pages.
- The empty-state UI (zero results) — not this module's job either.

---

## Reference implementation

Original source this was ported from: `inhouse-vendor/src/components/inhouse/pagination/infinite-scroll/`
and its real-world usage in
`inhouse-vendor/src/modules/dashboard/bids/my-bids/MyBidsHomeLayout.tsx`. Read there if you want to
see a second working example with a different backend pagination shape (`current_page`/`last_page`
instead of this project's `nextPage`).
