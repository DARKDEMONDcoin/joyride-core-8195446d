import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { integrations as CATALOG, INTEGRATION_CATEGORIES, type Integration } from "@/lib/integrationsData";
import {
  loadIntegrationConnections,
  startIntegrationConnection,
  disconnectIntegration,
  waitForConnectionRefresh,
} from "@/lib/integrationBackend";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Connectors sheet — the single place to manage integrations, opened from the
 * chat composer. Flat dark surface, search + category chips + connect rows.
 */
export default function IntegrationsSheet({ open, onOpenChange }: Props) {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [busy, setBusy] = useState<string | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

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
    if (open) void refresh();
  }, [open]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((i) => {
      if (category !== "All" && i.category !== category) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    });
  }, [query, category]);

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
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            dir="rtl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[9999] flex h-[88dvh] flex-col rounded-t-[26px] bg-[#1c1c1c]"
            style={{ border: 0, boxShadow: "none" }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />

            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
              <h2 className="text-[17px] font-semibold text-white">الموصلات</h2>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-white/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 px-4">
              <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.06] px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن تطبيق"
                  className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
                  style={{ border: 0 }}
                />
              </div>
            </div>

            <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {INTEGRATION_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                    category === c ? "bg-white text-black" : "bg-white/[0.07] text-white/70"
                  }`}
                  style={{ border: 0 }}
                >
                  {c === "All" ? "الكل" : c}
                </button>
              ))}
            </div>

            <div className="mt-2 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
              {list.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-white/40">لا توجد نتائج</p>
              ) : (
                list.map((item) => {
                  const isOn = !!connected[item.app];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-[16px] px-2.5 py-3"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/[0.07]">
                        {item.domain && !broken[item.id] ? (
                          <img
                            src={`https://logo.clearbit.com/${item.domain}`}
                            alt={item.name}
                            width={40}
                            height={40}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={() => setBroken((b) => ({ ...b, [item.id]: true }))}
                          />
                        ) : (
                          <span className="text-[13px] font-semibold text-white/70">
                            {item.name.slice(0, 1)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-semibold text-white">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-white/45">
                          {item.description}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(item)}
                        disabled={busy === item.app}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                          isOn ? "bg-white/[0.08] text-white/70" : "bg-primary text-primary-foreground"
                        }`}
                        style={{ border: 0 }}
                      >
                        {busy === item.app ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isOn ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> متصل
                          </span>
                        ) : (
                          "ربط"
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
