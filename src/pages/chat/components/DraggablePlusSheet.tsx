import { ReactNode } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";

interface DraggablePlusSheetProps {
  height: number;
  /** Kept for API compatibility — the sheet always opens at full height. */
  collapsedY?: number;
  onClose: () => void;
  children: ReactNode;
  initialExpanded?: boolean;
  dragEnabled?: boolean;
  view?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  bottomOffset?: number;
}

/**
 * Bottom sheet for the composer menus.
 * Opens fully so nothing is clipped, scrolls natively, and closes only when
 * the user drags the sheet (handle/header area) downwards.
 */
export const DraggablePlusSheet = ({
  height,
  onClose,
  children,
  onScroll,
  bottomOffset = 0,
}: DraggablePlusSheetProps) => {
  const y = useMotionValue(0);

  const close = () =>
    animate(y, height, { type: "spring", stiffness: 380, damping: 36, onComplete: onClose });

  return (
    <AnimatePresence>
      <motion.div
        key="plus-sheet"
        initial={{ y: height }}
        animate={{ y: 0 }}
        exit={{ y: height }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        style={{ y, height, paddingBottom: bottomOffset, boxShadow: "none" }}
        data-plus-menu
        onClick={(e) => e.stopPropagation()}
        className="mobile-plus-glass-menu md:hidden fixed left-0 right-0 bottom-0 z-overlay flex flex-col rounded-t-[28px] outline-none"
      >
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: height }}
          dragElastic={0.04}
          onDragEnd={(_, info) => {
            if (y.get() > 90 || info.velocity.y > 700) close();
            else animate(y, 0, { type: "spring", stiffness: 400, damping: 34 });
          }}
          className="shrink-0 cursor-grab active:cursor-grabbing pt-2.5 pb-2"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-foreground/25" />
        </motion.div>

        <div
          onScroll={onScroll}
          className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
