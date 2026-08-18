import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";

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

/** iOS-style springs: firm for snapping, softer for the auto-expand. */
const SNAP = { type: "spring" as const, stiffness: 420, damping: 42, mass: 0.9 };
const SOFT = { type: "spring" as const, stiffness: 300, damping: 34, mass: 0.9 };

/**
 * Bottom sheet with two snap points (collapsed / expanded).
 *
 * Physics:
 *  - Drag anywhere on the sheet while the content is at scrollTop 0.
 *  - Rubber-band resistance above the expanded snap point.
 *  - Velocity-projected snapping: a flick decides direction, not just distance.
 *  - Content scrolling is locked while collapsed, so the first upward gesture
 *    always expands the sheet instead of scrolling under it.
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
  const y = useMotionValue(height);
  const [expanded, setExpanded] = useState(initialExpanded);
  const expandedRef = useRef(initialExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  // Entry animation to the initial snap point.
  useEffect(() => {
    const controls = animate(y, startY, SOFT);
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setExpandedState = (next: boolean) => {
    expandedRef.current = next;
    setExpanded(next);
  };

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    animate(y, height, { ...SNAP, onComplete: onClose });
  }, [height, onClose, y]);

  const snapTo = useCallback(
    (target: "expanded" | "collapsed") => {
      setExpandedState(target === "expanded");
      animate(y, target === "expanded" ? 0 : collapsedY, SNAP);
    },
    [collapsedY, y],
  );

  const expand = useCallback(() => {
    if (expandedRef.current) return;
    snapTo("expanded");
  }, [snapTo]);

  const dragStartY = useRef(0);
  const canDrag = () => (scrollRef.current?.scrollTop ?? 0) <= 0;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const current = y.get();
    // Project where the sheet would land with the current flick velocity.
    const projected = current + info.velocity.y * 0.12;
    const collapsed = collapsedY;

    if (projected > collapsed + Math.max(80, (height - collapsed) * 0.35)) {
      close();
      return;
    }
    // Swipe up (past the expanded snap point) closes the sheet the same way
    // it opened - reversing the entry animation.
    if (expandedRef.current && (info.offset.y < -56 || info.velocity.y < -650)) {
      close();
      return;
    }
    if (collapsed <= 0) {
      snapTo("expanded");
      return;
    }
    const midpoint = collapsed / 2;
    snapTo(projected < midpoint ? "expanded" : "collapsed");
  };

  return (
    <motion.div
      key="plus-sheet"
      exit={{ y: height, transition: SNAP }}
      style={{
        y,
        height,
        paddingBottom: bottomOffset,
        boxShadow: "none",
        touchAction: "none",
      }}
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: height }}
      dragElastic={{ top: 0.06, bottom: 0.2 }}
      dragMomentum={false}
      onDragStart={() => {
        dragStartY.current = y.get();
      }}
      onDrag={(_, info) => {
        // Lock the sheet in place if the content is mid-scroll.
        if (!canDrag() && info.offset.y < 0) y.set(dragStartY.current);
      }}
      onDragEnd={handleDragEnd}
      data-plus-menu
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => {
        if (e.deltaY > 0) expand();
      }}
      className="mobile-plus-glass-menu md:hidden fixed left-0 right-0 bottom-0 z-overlay flex flex-col rounded-t-[28px] outline-none will-change-transform"
    >
      <div className="shrink-0 pt-2.5 pb-1.5">
        <motion.div
          animate={{ width: expanded ? 44 : 38, opacity: expanded ? 0.28 : 0.38 }}
          transition={SOFT}
          className="mx-auto h-[5px] rounded-full bg-foreground"
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
        style={{
          WebkitOverflowScrolling: "touch",
          overflowY: expanded ? "auto" : "hidden",
          touchAction: expanded ? "pan-y" : "none",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
