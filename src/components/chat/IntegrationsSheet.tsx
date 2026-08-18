import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { integrations as CATALOG, type Integration } from "@/lib/integrationsData";
import {
  loadIntegrationConnections,
  startIntegrationConnection,
  disconnectIntegration,
  waitForConnectionRefresh,
} from "@/lib/integrationBackend";
import IntegrationRow from "./integrations/IntegrationRow";
import IntegrationDetail from "./integrations/IntegrationDetail";
import EmptyConnectors from "./integrations/EmptyConnectors";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "apps" | "api" | "mcp";

const TABS: { id: Tab; label: string }[] = [
  { id: "apps", label: "تطبيقات" },
  { id: "api", label: "API مخصص" },
  { id: "mcp", label: "MCP مخصص" },
];

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38, mass: 0.9 };
const EXIT = { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const };

/**
 * Connectors sheet — the single place to manage integrations, opened from the
 * chat composer. Flat dark surface, drag-to-dismiss, list + detail levels.
 */
export default function IntegrationsSheet({ open, onOpenChange }: Props) {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("apps");
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<Integration | null>(null);

  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, decided: false, startY: 0, lastY: 0, lastT: 0, v: 0 });

  const refresh = async () => {
    try {
      const snap = await loadIntegrationConnections(CATALOG);
      setConnected(snap.connectedApps || {});
      return snap.connectedApps || {};
    } catch {
      return {};
    }
  };

  useEffect(() => {
    if (open) {
      void refresh();
      y.set(0);
      opacity.set(1);
    } else {
      setDetail(null);
      setQuery("");
    }
  }, [open]);

  const close = () => {
    void animate(opacity, 0, { duration: 0.2 });
    void animate(y, typeof window !== "undefined" ? window.innerHeight : 800, EXIT).then(() =>
      onOpenChange(false),
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
    );
  }, [query]);

  const connectedList = filtered.filter((i) => connected[i.app]);
  const restList = filtered.filter((i) => !connected[i.app]);

  const toggle = async (item: Integration) => {
    setBusy(item.app);
    try {
      if (connected[item.app]) {
        await disconnectIntegration(item);
        await refresh();
        toast.success(`تم فصل ${item.name}`);
      } else {
        const res = await startIntegrationConnection(item);
        if ("popup" in res && res.popup) {
          await waitForConnectionRefresh(async () => {
            const apps = await refresh();
            return !!apps[item.app];
          }, res.popup);
        } else {
          await refresh();
        }
        toast.success(`تم ربط ${item.name}`);
      }
    } catch (e: any) {
      toast.error(e?.message || "تعذّر إتمام العملية");
    } finally {
      setBusy(null);
    }
  };

  // ── drag-to-dismiss (downward, only when the scroller is at the top) ──
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("input,button")) {
      // still allow drag decision from headers; inputs keep focus behaviour
    }
    drag.current = {
      active: true,
      decided: false,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: performance.now(),
      v: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dy = e.clientY - d.startY;
    const atTop = (scrollerRef.current?.scrollTop ?? 0) <= 0;

    if (!d.decided) {
      if (Math.abs(dy) < 6) return;
      if (dy > 0 && atTop) {
        d.decided = true;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } else {
        d.active = false;
        return;
      }
    }

    const now = performance.now();
    const dt = Math.max(now - d.lastT, 1);
    d.v = 0.7 * ((e.clientY - d.lastY) / dt) * 1000 + 0.3 * d.v;
    d.lastY = e.clientY;
    d.lastT = now;
    y.set(Math.max(0, dy));
  };

  const onPointerUp = () => {
    const d = drag.current;
    d.active = false;
    if (!d.decided) return;
    const travel = y.get();
    if (travel > 120 || d.v > 700) close();
    else void animate(y, 0, SPRING);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[9998] bg-black/50"
            onClick={close}
          />
          <motion.div
            dir="rtl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            style={{ y, opacity, border: 0, boxShadow: "none", touchAction: "none" }}
            className="fixed inset-x-0 bottom-0 z-[9999] flex h-[88dvh] flex-col rounded-t-[26px] bg-[#1c1c1c]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />

            {detail ? (
              <motion.div
                key="detail"
                initial={{ x: "-8%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <IntegrationDetail
                  item={detail}
                  connected={!!connected[detail.app]}
                  busy={busy === detail.app}
                  onBack={() => setDetail(null)}
                  onToggle={() => void toggle(detail)}
                />
              </motion.div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
                  <button
                    type="button"
                    aria-label="إغلاق"
                    onClick={close}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white/60"
                    style={{ border: 0 }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-[16.5px] font-semibold text-white">الموصلات</h2>
                  <button
                    type="button"
                    aria-label="إضافة موصل"
                    onClick={() => setTab("api")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white/60"
                    style={{ border: 0 }}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="shrink-0 px-4">
                  <div className="flex items-center gap-2 rounded-[16px] bg-[#262627] px-3.5 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-white/40" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="البحث عن الموصلات"
                      className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
                      style={{ border: 0, touchAction: "auto" }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex shrink-0 gap-2 px-4">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`rounded-full px-4 py-2 text-[13px] transition-colors ${
                        tab === t.id ? "bg-white font-medium text-black" : "bg-[#262627] text-white/60"
                      }`}
                      style={{ border: 0 }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div
                  ref={scrollerRef}
                  className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
                  style={{ touchAction: "pan-y" }}
                >
                  {tab !== "apps" ? (
                    <EmptyConnectors
                      label={tab === "api" ? "لا يوجد API مخصص" : "لا يوجد MCP مخصص"}
                      actionLabel="الإنشاء عبر الدردشة"
                      onAction={close}
                    />
                  ) : filtered.length === 0 ? (
                    <EmptyConnectors label="لا توجد نتائج" />
                  ) : (
                    <>
                      {connectedList.length > 0 && (
                        <div className="mb-5">
                          <p className="px-3 pb-1 text-[12px] text-white/40">المتصل</p>
                          <div className="overflow-hidden rounded-[18px] bg-[#262627]">
                            {connectedList.map((item) => (
                              <IntegrationRow
                                key={item.id}
                                item={item}
                                connected
                                busy={busy === item.app}
                                onOpen={() => setDetail(item)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {restList.map((item) => (
                        <IntegrationRow
                          key={item.id}
                          item={item}
                          connected={false}
                          busy={busy === item.app}
                          onOpen={() => setDetail(item)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
