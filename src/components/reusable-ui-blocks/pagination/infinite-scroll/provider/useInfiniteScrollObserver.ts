"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseInfiniteScrollObserverOptions {
  hasMore: boolean;
  isFetching: boolean;
  onIntersect: () => void;
}

export function useInfiniteScrollObserver({
  hasMore,
  isFetching,
  onIntersect,
}: UseInfiniteScrollObserverOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const onIntersectRef = useRef(onIntersect);

  // Keep the callback ref up to date without re-attaching the observer.
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // Ref callback — fires when React mounts/unmounts the sentinel element.
  const triggerRef = useCallback(
    (el: HTMLDivElement | null) => {
      // Tear down any existing observer first.
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!el || !hasMore || isFetching) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onIntersectRef.current();
          }
        },
        { threshold: 0, rootMargin: "0px 0px 100px 0px" },
      );

      observer.observe(el);
      observerRef.current = observer;
    },
    [hasMore, isFetching],
  );

  return { triggerRef };
}
