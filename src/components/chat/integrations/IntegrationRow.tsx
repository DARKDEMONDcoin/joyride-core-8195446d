import { useState } from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import type { Integration } from "@/lib/integrationsData";

export function IntegrationLogo({ item, size = 44 }: { item: Integration; size?: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/[0.07]"
      style={{ width: size, height: size }}
    >
      {item.domain && !broken ? (
        <img
          src={`https://logo.clearbit.com/${item.domain}`}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="text-[13px] font-semibold text-white/70">{item.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

interface RowProps {
  item: Integration;
  connected: boolean;
  busy: boolean;
  onOpen: () => void;
}

/** Flat connector row: logo + name + 2-line description + status on the far side. */
export default function IntegrationRow({ item, connected, busy, onOpen }: RowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-right transition-colors active:bg-white/[0.04]"
      style={{ border: 0, background: "transparent", minHeight: 64 }}
    >
      <IntegrationLogo item={item} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-white">{item.name}</span>
        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-[1.5] text-white/45">
          {item.description}
        </span>
      </span>
      <span className="shrink-0 text-white/45">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : connected ? (
          <Check className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
        ) : (
          <span className="inline-flex items-center gap-1 text-[12.5px]">
            اتصال
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
      </span>
    </button>
  );
}
