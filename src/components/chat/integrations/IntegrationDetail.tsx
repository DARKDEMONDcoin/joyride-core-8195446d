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

/** Level 2 — connector detail. Scrolling is owned by the sheet container. */
export default function IntegrationDetail({ item, connected, busy, onBack, onToggle }: Props) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex shrink-0 items-center justify-between pb-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="رجوع"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-foreground/70"
          style={{ border: 0 }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="text-[15px] font-semibold text-foreground">{item.name}</span>
        <span className="h-8 w-8" />
      </div>

      <div className="flex flex-col items-center pt-4 text-center">
        <IntegrationLogo item={item} size={72} />
        <h3 className="mt-3 text-[19px] font-semibold text-foreground">{item.name}</h3>
        <p className="mt-2 max-w-[34ch] text-[13px] leading-[1.7] text-foreground/50">
          {`اربط حساب ${item.name} لاستخدامه بأمان وتنفيذ المهام من داخل المحادثة.`}
        </p>
      </div>

      <p className="mb-1 mt-6 px-2 text-[12.5px] text-foreground/40">التفاصيل</p>
      <div className="overflow-hidden rounded-[18px]">
        <DetailRow label="نوع التكامل" value={typeLabel(item.type)} />
        <DetailRow label="الفئة" value={item.category} />
        {item.domain && <DetailRow label="الموقع" value={item.domain} />}
        <DetailRow label="المعرّف" value={item.app} last />
      </div>


      <div className="mt-6 pb-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center rounded-[16px] bg-transparent text-[14.5px] font-semibold transition-opacity active:opacity-80"
          style={{ border: 0, color: connected ? undefined : "hsl(var(--primary))" }}
        >
          {busy ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : connected ? (
            <span className="text-foreground/70">فصل</span>
          ) : (
            "اتصال"
          )}
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
      <span className="text-[13px] text-foreground/45">{label}</span>
      <span className="max-w-[60%] truncate text-[13.5px] text-foreground">{value}</span>
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
