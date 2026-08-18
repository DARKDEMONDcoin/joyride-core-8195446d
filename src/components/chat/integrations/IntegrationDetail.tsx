import { ChevronRight, Loader2 } from "lucide-react";
import type { Integration } from "@/lib/integrationsData";
import { IntegrationLogo } from "./IntegrationRow";

interface Props {
  item: Integration;
  connected: boolean;
  busy: boolean;
  onBack: () => void;
  onToggle: () => void;
}

/** Level 2 — connector detail with a sticky primary action. */
export default function IntegrationDetail({ item, connected, busy, onBack, onToggle }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="رجوع"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white/70"
          style={{ border: 0 }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="text-[15px] font-semibold text-white">{item.name}</span>
        <span className="h-8 w-8" />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="flex flex-col items-center pt-4 text-center">
          <IntegrationLogo item={item} size={72} />
          <h3 className="mt-3 text-[19px] font-semibold text-white">{item.name}</h3>
          <p className="mt-2 max-w-[34ch] text-[13px] leading-[1.7] text-white/50">
            {item.description}
          </p>
        </div>

        <p className="mb-2 mt-6 text-[12.5px] text-white/40">التفاصيل</p>
        <div className="overflow-hidden rounded-[18px] bg-[#262627]">
          <DetailRow label="نوع الموصل" value={typeLabel(item.type)} />
          <DetailRow label="الفئة" value={item.category} />
          {item.domain && <DetailRow label="الموقع الإلكتروني" value={item.domain} />}
          <DetailRow label="المعرّف" value={item.app} last />
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={`inline-flex h-12 w-full items-center justify-center rounded-[16px] text-[14.5px] font-semibold transition-colors ${
            connected ? "bg-white/[0.08] text-white/70" : "bg-primary text-primary-foreground"
          }`}
          style={{ border: 0 }}
        >
          {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : connected ? "فصل" : "اتصال"}
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5"
      style={last ? undefined : { boxShadow: "inset 0 -1px 0 hsl(var(--foreground) / 0.06)" }}
    >
      <span className="text-[13px] text-white/45">{label}</span>
      <span className="max-w-[60%] truncate text-[13.5px] text-white">{value}</span>
    </div>
  );
}

function typeLabel(t: Integration["type"]) {
  switch (t) {
    case "oauth":
      return "OAuth";
    case "notification":
      return "إشعارات";
    case "service":
      return "خدمة";
    default:
      return "تطبيق";
  }
}
