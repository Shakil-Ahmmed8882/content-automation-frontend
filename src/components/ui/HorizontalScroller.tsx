"use client";

import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import { animate, motion, type PanInfo, useMotionValue } from "framer-motion";
import * as React from "react";

// min-w-0: prevents the track's intrinsic (w-max) min-content size from propagating
//   up and forcing ancestor flex items to grow past their parent. Without this, the
//   track's total tab width becomes the min-width of every ancestor, breaking sibling
//   columns (e.g. right sidebar) and pushing the whole page right.
// max-w-full: belt-and-suspenders cap so the component never exceeds its parent.
const scrollerVariants = cva(
  "relative w-full max-w-full min-w-0 overflow-hidden select-none",
  {
    variants: {
      spacing: {
        none: "gap-0",
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-8",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
      },
    },
    defaultVariants: {
      spacing: "md",
      align: "center",
    },
  },
);

export interface HorizontalScrollerHandle {
  /**
   * Smoothly brings a descendant element into view if it is clipped by the
   * container. A no-op when the element is already fully visible.
   */
  scrollChildIntoView: (element: HTMLElement | null, padding?: number) => void;
}

interface HorizontalScrollerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollerVariants> {
  onDragEndCallback?: (info: PanInfo) => void;
}

export const HorizontalScroller = React.forwardRef<
  HorizontalScrollerHandle,
  HorizontalScrollerProps
>(
  (
    { children, spacing, align, className, onDragEndCallback, ...props },
    ref,
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const trackRef = React.useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const [maxDrag, setMaxDrag] = React.useState(0);
    const maxDragRef = React.useRef(0);

    const calculateDrag = React.useCallback(() => {
      if (!containerRef.current || !trackRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = trackRef.current.scrollWidth;

      const draggable = contentWidth - containerWidth;
      const next = draggable > 0 ? draggable : 0;

      maxDragRef.current = next;
      setMaxDrag(next);

      // Clamp if resized
      if (x.get() < -next) {
        x.set(-next);
      }
    }, [x]);

    React.useLayoutEffect(() => {
      calculateDrag();

      const resizeObserver = new ResizeObserver(calculateDrag);
      if (trackRef.current) resizeObserver.observe(trackRef.current);
      if (containerRef.current) resizeObserver.observe(containerRef.current);

      window.addEventListener("resize", calculateDrag);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", calculateDrag);
      };
    }, [children, calculateDrag]);

    React.useImperativeHandle(
      ref,
      () => ({
        scrollChildIntoView: (element, padding = 16) => {
          const container = containerRef.current;
          const track = trackRef.current;
          if (!element || !container || !track) return;

          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const currentX = x.get();

          // Offset of element relative to the track's current transform origin.
          const elementLeftInTrack =
            elementRect.left - containerRect.left - currentX;
          const elementRightInTrack = elementLeftInTrack + elementRect.width;
          const containerWidth = containerRect.width;

          // Already fully in view — nothing to do.
          const visibleLeft = -currentX;
          const visibleRight = visibleLeft + containerWidth;
          if (
            elementLeftInTrack >= visibleLeft + padding &&
            elementRightInTrack <= visibleRight - padding
          ) {
            return;
          }

          let targetX: number;
          if (elementLeftInTrack < visibleLeft + padding) {
            // Off to the left → scroll so element sits near container's left edge.
            targetX = -(elementLeftInTrack - padding);
          } else {
            // Off to the right → scroll so element sits near container's right edge.
            targetX = -(elementRightInTrack - containerWidth + padding);
          }

          // Clamp to drag bounds.
          const clamped = Math.min(0, Math.max(-maxDragRef.current, targetX));
          if (clamped === currentX) return;

          animate(x, clamped, {
            type: "spring",
            stiffness: 260,
            damping: 32,
            mass: 0.6,
          });
        },
      }),
      [x],
    );

    return (
      <div
        ref={containerRef}
        className={clsx(scrollerVariants({ spacing, align }), className)}
        {...props}
      >
        {/*
         * w-max: sizes to content so scrollWidth > containerWidth → drag works.
         * The track must NOT be w-full or it matches container width → maxDrag = 0.
         * gap spacing is passed explicitly from the variant so className gap overrides
         * from callers (e.g. className="gap-x-4") are replicated here via the
         * trackGap prop pattern — instead we read computed gap from the container.
         */}
        <motion.div
          ref={trackRef}
          className="flex flex-nowrap touch-pan-y w-max"
          style={{ x, cursor: "grab", gap: "inherit" }}
          drag="x"
          dragConstraints={{ left: -maxDrag, right: 0 }}
          dragElastic={0.08}
          dragMomentum
          whileTap={{ cursor: "grabbing" }}
          onDragEnd={(
            _event: MouseEvent | TouchEvent | PointerEvent,
            info: PanInfo,
          ) => {
            onDragEndCallback?.(info);
          }}
        >
          {children}
        </motion.div>
      </div>
    );
  },
);

HorizontalScroller.displayName = "HorizontalScroller";
