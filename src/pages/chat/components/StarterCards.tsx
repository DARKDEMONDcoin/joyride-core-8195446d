import { useState } from "react";
import { X } from "lucide-react";
import researchImg from "@/assets/svc-research.png";
import imageImg from "@/assets/svc-image.png";
import videoImg from "@/assets/svc-video.png";
import slidesImg from "@/assets/svc-slides.png";
import codeImg from "@/assets/svc-code.png";
import webImg from "@/assets/svc-web.png";
import docsImg from "@/assets/svc-docs.png";
import agentImg from "@/assets/svc-agent.png";
import integrationsImg from "@/assets/svc-integrations.png";

export interface StarterCardsProps {
  /** Fills the composer with the card prompt. */
  onPick: (prompt: string) => void;
  className?: string;
}

/** Every real service the app offers — no filler. */
const CARDS = [
  {
    id: "research",
    img: researchImg,
    title: "بحث عميق",
    desc: "تقرير منظّم مع مصادر موثوقة.",
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
    id: "video",
    img: videoImg,
    title: "توليد الفيديو",
    desc: "مقاطع قصيرة من فكرة مكتوبة.",
    prompt: "ولّد لي فيديو قصير عن: ",
  },
  {
    id: "slides",
    img: slidesImg,
    title: "عرض تقديمي",
    desc: "شرائح متكاملة بتصميم نظيف.",
    prompt: "اعمل لي عرض تقديمي متكامل عن: ",
  },
  {
    id: "code",
    img: codeImg,
    title: "كتابة وتنفيذ كود",
    desc: "مشروع كامل مع معاينة مباشرة.",
    prompt: "اكتب لي كود لمشروع: ",
  },
  {
    id: "web",
    img: webImg,
    title: "بناء موقع",
    desc: "صفحة أو موقع كامل جاهز للنشر.",
    prompt: "ابنِ لي موقع ويب عن: ",
  },
  {
    id: "docs",
    img: docsImg,
    title: "تحليل المستندات",
    desc: "ارفع PDF أو ملف واسأل عنه.",
    prompt: "حلّل لي هذا المستند واستخرج أهم النقاط: ",
  },
  {
    id: "agent",
    img: agentImg,
    title: "وكيل ذكي",
    desc: "ينفّذ مهام متعددة الخطوات نيابة عنك.",
    prompt: "نفّذ كوكيل ذكي المهمة التالية خطوة بخطوة: ",
  },
  {
    id: "integrations",
    img: integrationsImg,
    title: "التكاملات",
    desc: "اربط تطبيقاتك ونفّذ منها مباشرة.",
    prompt: "استخدم التكاملات المربوطة عندي عشان: ",
  },
];

/**
 * Manus-style starter carousel shown above the composer before the first
 * message. Transparent artwork, horizontal scroll, dismissible per session.
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

      <div className="flex gap-2.5 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
        {CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.prompt)}
            className="snap-start shrink-0 w-[84%] max-w-[330px] flex items-center gap-3 rounded-[16px] border-0 bg-[color:var(--chat-claude-composer,#262627)] hover:brightness-110 active:scale-[0.99] transition-all px-3.5 py-3 text-start"
          >
            <img
              src={c.img}
              alt=""
              loading="lazy"
              decoding="async"
              width={512}
              height={512}
              className="w-[58px] h-[58px] object-contain shrink-0"
            />
            <span className="min-w-0 flex flex-col gap-1">
              <span className="text-[15px] font-bold leading-tight text-foreground truncate">
                {c.title}
              </span>
              <span className="text-[12.5px] leading-snug text-foreground/45 line-clamp-2">
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
