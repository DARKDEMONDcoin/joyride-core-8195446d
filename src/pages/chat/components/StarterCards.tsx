import { useState } from "react";
import { X } from "lucide-react";
import gameImg from "@/assets/starter-game.jpg";
import agentImg from "@/assets/starter-agent.jpg";
import websiteImg from "@/assets/starter-website.jpg";
import researchImg from "@/assets/starter-research.jpg";

export interface StarterCardsProps {
  /** Fills the composer with the card prompt. */
  onPick: (prompt: string) => void;
  className?: string;
}

const CARDS = [
  {
    id: "game",
    img: gameImg,
    title: "أنشئ لعبتك الخاصة",
    desc: "صِف فكرتك، وسأبني لك لعبة قابلة للعب.",
    prompt: "اعملي لعبة بسيطة قابلة للعب على المتصفح، ابدأ باقتراح الفكرة والميكانيكا.",
  },
  {
    id: "agent",
    img: agentImg,
    title: "احصل على Agent الخاص بك",
    desc: "هوية مميزة مع ذاكرة تنمو معك.",
    prompt: "ساعدني أبني وكيل ذكي بشخصية وذاكرة خاصة بمهامي اليومية.",
  },
  {
    id: "website",
    img: websiteImg,
    title: "ابنِ موقعك في دقائق",
    desc: "صفحة هبوط كاملة جاهزة للنشر.",
    prompt: "ابنِ لي موقع هبوط احترافي لمشروعي مع أقسام وأزرار دعوة للإجراء.",
  },
  {
    id: "research",
    img: researchImg,
    title: "بحث عميق بمصادر",
    desc: "تقرير منظّم مع مراجع موثوقة.",
    prompt: "اعمل بحث عميق ومنظم مع مصادر عن موضوع سأحدده الآن:",
  },
];

/**
 * Manus-style starter carousel shown above the composer before the first
 * message. Horizontally scrollable image cards; dismissible for the session.
 */
export function StarterCards({ onPick, className = "" }: StarterCardsProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-[13px] font-semibold text-foreground/80">ابدأ الآن</span>
        <button
          type="button"
          aria-label="إخفاء الاقتراحات"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full text-foreground/45 hover:text-foreground/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        {CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.prompt)}
            className="snap-start shrink-0 w-[85%] sm:w-[320px] flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 hover:border-primary/40 active:scale-[0.99] transition-all p-3 text-start"
          >
            <img
              src={c.img}
              alt=""
              loading="lazy"
              decoding="async"
              width={512}
              height={512}
              className="w-14 h-14 rounded-xl object-cover shrink-0 bg-background"
            />
            <span className="min-w-0 flex flex-col gap-1">
              <span className="text-[14px] font-semibold leading-tight text-foreground truncate">
                {c.title}
              </span>
              <span className="text-[12px] leading-snug text-muted-foreground line-clamp-2">
                {c.desc}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default StarterCards;
