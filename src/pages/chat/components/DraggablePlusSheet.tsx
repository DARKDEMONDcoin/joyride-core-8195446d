import { ReactNode, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";

interface DraggablePlusSheetProps {
  height: number;
  /** Distance the sheet is pushed down when collapsed (compact state). */
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
 * Opens compact, expands automatically to full height as soon as the user
 * scrolls the content up, and closes when dragged down.
 */
export const DraggablePlusSheet = ({
  height,
  collapsedY = 0,
  onClose,
  children,
  onScroll,
  initialExpanded = false,
  bottomOffset = 0,
}: DraggablePlusSheetProps) => {
  const startY = initialExpanded ? 0 : collapsedY;
  const y = useMotionValue(startY);
  const [expanded, setExpanded] = useState(initialExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  const close = () =>
    animate(y, height, { type: "spring", stiffness: 380, damping: 36, onComplete: onClose });

  const expand = () => {
    if (expanded) return;
    setExpanded(true);
    animate(y, 0, { type: "spring", stiffness: 320, damping: 34 });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!expanded && e.currentTarget.scrollTop > 4) expand();
    onScroll?.(e);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="plus-sheet"
        initial={{ y: height }}
        animate={{ y: startY }}
        exit={{ y: height }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        style={{ y, height, paddingBottom: bottomOffset, boxShadow: "none" }}
        data-plus-menu
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (e.deltaY > 0) expand();
        }}
        className="mobile-plus-glass-menu md:hidden fixed left-0 right-0 bottom-0 z-overlay flex flex-col rounded-t-[28px] outline-none"
      >
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: height }}
          dragElastic={0.04}
          onDragEnd={(_, info) => {
            const current = y.get();
            if (info.velocity.y < -400 || current < startY - 40) {
              expand();
              return;
            }
            if (current > startY + 90 || info.velocity.y > 700) {
              close();
              return;
            }
            animate(y, expanded ? 0 : startY, { type: "spring", stiffness: 400, damping: 34 });
          }}
          className="shrink-0 cursor-grab active:cursor-grabbing pt-2.5 pb-2"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-foreground/25" />
        </motion.div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchMove={() => {
            if (!expanded && (scrollRef.current?.scrollTop ?? 0) > 0) expand();
          }}
          className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
