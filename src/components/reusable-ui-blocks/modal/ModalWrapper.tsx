"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
};

export function ModalWrapper({ open, setOpen, children }: Props) {
  useEffect(() => {
    const html = document.documentElement;
    if (open) {
      html.classList.add("modal-lock");
    } else {
      html.classList.remove("modal-lock");
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      html.classList.remove("modal-lock");
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 bottom-0 w-[100vw] z-[99] overflow-y-scroll bg-background/80 backdrop-blur-sm flex flex-col items-center"
          onClick={() => setOpen(false)}
        >
          {/* Content Wrapper:
             We use py-12 to give the modal space at top/bottom when scrolling 
          */}
          <div className="flex min-h-full w-full items-start justify-center p-4 md:py-20 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              /* pointer-events-auto allows interaction with the modal itself */
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-[610px] rounded-lg border border-border bg-card text-card-foreground shadow-modal pointer-events-auto my-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
