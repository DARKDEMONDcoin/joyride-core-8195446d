import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

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
 * iOS-style springs.
 * SNAP  - firm, used for every settle (open / collapse / expand / close).
 * SOFT  - slightly softer, used for the handle morph.
 */
const SNAP = { type: "spring" as const, stiffness: 460, damping: 44, mass: 0.9 };
const SOFT = { type: "spring" as const, stiffness: 300, damping: 34, mass: 0.9 };

/** Rubber-band resistance beyond a snap point (iOS scroll-bounce curve). */
const rubber = (overshoot: number, dimension: number) =>
  (1 - 1 / ((overshoot * 0.55) / dimension + 1)) * dimension;

/** px/ms thresholds. */
const FLICK = 0.55;
const STRONG_FLICK = 1.1;

/**
 * Bottom sheet with two snap points (collapsed / expanded) and one dismiss
 * point (fully off-screen).
 *
 * Gesture model (single pointer, no library drag - the library's drag fights
 * the inner scroller):
 *  - The gesture direction is decided once, after a 6px threshold, and the
 *    sheet either drags or the content scrolls for the rest of that gesture.
 *  - Dragging down is only allowed when the content is at scrollTop 0, so a
 *    mid-list drag never yanks the sheet.
 *  - Dragging up expands while collapsed; while expanded it scrolls the list,
 *    except for a strong upward flick at the very top, which dismisses.
 *  - Settling is velocity-projected: a flick decides the direction, distance
 *    only matters for slow drags.
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
  const startSnap = initialExpanded || collapsedY <= 0 ? 0 : collapsedY;
  const y = useMotionValue(height);
  const [expanded, setExpanded] = useState(initialExpanded || collapsedY <= 0);
  const expandedRef = useRef(expanded);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    const controls = animate(y, startSnap, SNAP);
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setExpandedState = useCallback((next: boolean) => {
    expandedRef.current = next;
    setExpanded(next);
  }, []);

  const close = useCallback(
    (direction: "down" | "up" = "down", velocity = 0) => {
      if (closingRef.current) return;
      closingRef.current = true;
      animate(y, direction === "up" ? -height : height, {
        ...SNAP,
        velocity,
        onComplete: onClose,
      });
    },
    [height, onClose, y],
  );

  const snapTo = useCallback(
    (target: "expanded" | "collapsed", velocity = 0) => {
      setExpandedState(target === "expanded");
      animate(y, target === "expanded" ? 0 : collapsedY, { ...SNAP, velocity });
    },
    [collapsedY, setExpandedState, y],
  );

  /* ------------------------------ gestures ------------------------------ */

  const g = useRef({
    active: false,
    decided: false,
    dragging: false,
    startY: 0,
    baseY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
  });

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const atTop = () => (scrollRef.current?.scrollTop ?? 0) <= 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      g.current = {
        active: true,
        decided: false,
        dragging: false,
        startY: e.clientY,
        baseY: y.get(),
        lastY: e.clientY,
        lastT: performance.now(),
        velocity: 0,
      };
    };

    const onMove = (e: PointerEvent) => {
      const s = g.current;
      if (!s.active) return;

      const dy = e.clientY - s.startY;
      const now = performance.now();
      const dt = now - s.lastT;
      if (dt > 0) {
        // Low-pass filtered velocity so a single jittery frame can't flick.
        const v = (e.clientY - s.lastY) / dt;
        s.velocity = s.velocity * 0.7 + v * 0.3;
        s.lastY = e.clientY;
        s.lastT = now;
      }

      if (!s.decided) {
        if (Math.abs(dy) < 6) return;
        s.decided = true;
        const down = dy > 0;
        // Down: drag only from the top of the list. Up: drag while collapsed
        // (expanding) or while expanded and already at the top of the list
        // (dismiss upward). Otherwise the list scrolls.
        s.dragging = down ? atTop() : !expandedRef.current || atTop();
        if (s.dragging) {
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            /* capture is best-effort */
          }
        }
      }

      if (!s.dragging) return;
      e.preventDefault();

      let next = s.baseY + dy;
      // Above the expanded snap point the sheet keeps following the finger
      // (upward dismiss), with a light rubber-band for the first few px.
      if (next < 0 && !expandedRef.current) next = -rubber(-next, height);
      y.set(next);
    };

    const settle = (e: PointerEvent) => {
      const s = g.current;
      if (!s.active) return;
      s.active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      const v = s.velocity; // px/ms, + is downward
      const upFlick = -v;

      // Strong upward flick from the very top of an expanded sheet dismisses
      // it, reversing the opening animation.
      if (!s.dragging) {
        if (expandedRef.current && atTop() && upFlick > STRONG_FLICK)
          close("up", v * 1000);
        return;
      }

      const current = y.get();
      // Project where the sheet lands with the current momentum (~120ms).
      const projected = current + v * 120;
      const dismissLine = collapsedY + Math.max(96, (height - collapsedY) * 0.4);

      // Pulled above the expanded snap point: dismiss upward on a flick or
      // once it has travelled far enough, otherwise settle back to expanded.
      if (current < 0 || projected < 0) {
        if (upFlick > FLICK || projected < -72) close("up", v * 1000);
        else snapTo("expanded", v * 1000);
        return;
      }

      if (v > FLICK || projected > dismissLine) {
        close("down", v * 1000);
        return;
      }
      if (upFlick > FLICK) {
        if (collapsedY <= 0) close("up", v * 1000);
        else snapTo("expanded", v * 1000);
        return;
      }
      if (collapsedY <= 0) {
        snapTo("expanded", v * 1000);
        return;
      }
      snapTo(projected < collapsedY / 2 ? "expanded" : "collapsed", v * 1000);
    };

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", settle);
    el.addEventListener("pointercancel", settle);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", settle);
      el.removeEventListener("pointercancel", settle);
    };
  }, [close, collapsedY, height, snapTo, y]);

  return (
    <motion.div
      ref={sheetRef}
      key="plus-sheet"
      exit={{ y: height, transition: SNAP }}
      style={{
        y,
        height,
        paddingBottom: bottomOffset,
        boxShadow: "none",
        // The scroller owns vertical panning while expanded; while collapsed
        // nothing may pan natively so the first gesture always hits the sheet.
        touchAction: expanded ? "pan-y" : "none",
      }}
      data-plus-menu
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => {
        if (e.deltaY > 0 && !expandedRef.current) snapTo("expanded");
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
