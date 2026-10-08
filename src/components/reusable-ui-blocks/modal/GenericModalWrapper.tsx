"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type React from "react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useScrollLock } from "../utils/scroll/useScrollLock";

type TContextType = {
  onOpenChange: (open: boolean) => void;
  titleId: string;
};

const ModalContext = createContext<TContextType | null>(null);

type TProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Id to put on the modal's heading so the dialog is announced with its title. */
export const useModalTitleId = () => useContext(ModalContext)?.titleId;

export const GenericModalWrapperRoot = ({
  open,
  onOpenChange,
  children,
}: TProps) => {
  const titleId = useId();
  useScrollLock(open);

  return (
    <ModalContext.Provider value={{ onOpenChange, titleId }}>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* Backdrop: Fixed and behind everything */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-99998"
                />
                <div
                  className="fixed inset-0 z-99999 overflow-y-auto bg-transparent"
                  role="presentation"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) onOpenChange(false);
                  }}
                >
                  {/* Centering wrapper */}
                  <div className="min-h-full w-full flex items-center justify-center p-4 pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-[510px] my-10">
                      {children}
                    </div>
                  </div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ModalContext.Provider>
  );
};

const Content = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const context = useContext(ModalContext);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog on open (preferring `data-autofocus`), and hand
  // it back to whatever opened the dialog once it is gone.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const opener = document.activeElement as HTMLElement | null;
    const preferred = panel.querySelector<HTMLElement>("[data-autofocus]");
    (preferred ?? panel).focus();
    return () => opener?.focus?.();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      context?.onOpenChange(false);
      return;
    }
    if (event.key !== "Tab") return;

    // Keep Tab / Shift+Tab cycling inside the dialog.
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (
      event.shiftKey &&
      (active === first || active === event.currentTarget)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={context?.titleId}
      tabIndex={-1}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative w-full rounded-[16px] border border-border bg-card p-5 text-card-foreground shadow-2xl outline-none md:p-8",
        className,
      )}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      {children}
    </motion.div>
  );
};

const CloseButton = ({ onClick }: { onClick?: () => void }) => {
  const context = useContext(ModalContext);
  const handleClick = () =>
    onClick ? onClick() : context?.onOpenChange(false);

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={handleClick}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
    >
      <X className="w-5 h-5 text-muted-foreground" />
    </button>
  );
};

export const GenericModalWrapper = Object.assign(GenericModalWrapperRoot, {
  CloseButton,
  Content,
});
