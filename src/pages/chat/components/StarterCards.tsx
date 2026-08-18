import { useState } from "react";
import { X } from "lucide-react";
import researchImg from "@/assets/starter-research.jpg";
import imageImg from "@/assets/starter-image.jpg";
import slidesImg from "@/assets/starter-slides.jpg";
import codeImg from "@/assets/starter-code.jpg";

export interface StarterCardsProps {
  /** Fills the composer with the card prompt. */
  onPick: (prompt: string) => void;
  className?: string;
}

/** Real capabilities of the app — no filler. */
const CARDS = [
  {
    id: "research",
    img: researchImg,
    title: "بحث عميق بمصادر",
    desc: "تقرير منظّم مع مراجع موثوقة.",
    prompt: "اعمل بحث عميق ومنظم مع مصادر عن: ",
  },
  {
    id: "image",
    img: imageImg,
    title: "توليد الصور",
    desc: "صور عالية الجودة من وصف نصي.",
    prompt: "ولّد لي صورة عالية الجودة لـ: ",
  },
  {
    id: "slides",
    img: slidesImg,
    title: "عرض تقديمي جاهز",
    desc: "شرائح متكاملة بتصميم نظيف.",
    prompt: "اعمل لي عرض تقديمي متكامل عن: ",
  },
  {
    id: "code",
    img: codeImg,
    title: "اكتب ونفّذ كود",
    desc: "مشروع كامل مع معاينة مباشرة.",
    prompt: "اكتب لي كود لمشروع: ",
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
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-[13px] font-medium text-foreground/70">ابدأ الآن</span>
        <button
          type="button"
          aria-label="إخفاء الاقتراحات"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full text-foreground/45 hover:text-foreground/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
        {CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.prompt)}
            className="snap-start shrink-0 w-[268px] flex items-center gap-3 rounded-[18px] border-0 bg-[color:var(--chat-claude-composer,#1c1c1c)] hover:brightness-110 active:scale-[0.99] transition-all p-2.5 text-start"
          >
            <img
              src={c.img}
              alt=""
              loading="lazy"
              decoding="async"
              width={816}
              height={816}
              className="w-[54px] h-[54px] rounded-[13px] object-cover shrink-0"
            />
            <span className="min-w-0 flex flex-col gap-1">
              <span className="text-[14px] font-semibold leading-tight text-foreground truncate">
                {c.title}
              </span>
              <span className="text-[12px] leading-snug text-foreground/50 line-clamp-2">
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
