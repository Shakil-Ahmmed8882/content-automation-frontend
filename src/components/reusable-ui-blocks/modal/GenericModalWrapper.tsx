"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type React from "react";
import { createContext, type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../utils/scroll/useScrollLock";

type TContextType = {
  onOpenChange: (open: boolean) => void;
};

const ModalContext = createContext<TContextType | null>(null);

type TProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export const GenericModalWrapperRoot = ({
  open,
  onOpenChange,
  children,
}: TProps) => {
  useScrollLock(open);

  return (
    <ModalContext.Provider value={{ onOpenChange }}>
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
                  className="fixed inset-0 bg-black/30 z-[99998]"
                />
                <div
                  className="fixed inset-0 z-[99999] overflow-y-auto bg-transparent "
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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className={`${className} relative bg-white p-5 md:p-8 rounded-[16px] shadow-2xl w-full`}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
      onClick={handleClick}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 transition-colors"
    >
      <X className="w-5 h-5 text-gray-500" />
    </button>
  );
};

export const GenericModalWrapper = Object.assign(GenericModalWrapperRoot, {
  CloseButton,
  Content,
});
