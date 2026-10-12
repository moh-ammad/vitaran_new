import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Layers,
  Navigation,
  PenTool,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JOURNEY_PATH =
  "M70 330 C130 330 140 280 190 280 C250 280 300 250 290 210 C280 170 170 190 160 150 C150 110 250 80 310 80";

type Milestone = {
  icon: LucideIcon;
  label: string;
  x: number;
  y: number;
  labelPosition: "top" | "bottom" | "left" | "right";
};

const milestones: Milestone[] = [
  { icon: BookOpen, label: "Curriculum", x: 70, y: 330, labelPosition: "top" },
  { icon: PenTool, label: "Instructional design", x: 190, y: 280, labelPosition: "bottom" },
  { icon: Layers, label: "Content", x: 290, y: 210, labelPosition: "right" },
  { icon: ClipboardCheck, label: "Assessment", x: 160, y: 150, labelPosition: "left" },
];

const destination = { x: 310, y: 80 };

const toPercent = (value: number) => `${(value / 400) * 100}%`;

const labelClasses: Record<Milestone["labelPosition"], string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-3 -translate-y-1/2",
  right: "left-full top-1/2 ml-3 -translate-y-1/2",
};

export function LearningMap() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 size-full"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="journey-gradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#b3b4cc" />
              <stop offset="100%" stopColor="#8f95ff" />
            </linearGradient>
          </defs>

          <g stroke="white" strokeOpacity="0.07">
            <ellipse cx="90" cy="110" rx="70" ry="45" />
            <ellipse cx="90" cy="110" rx="45" ry="28" />
            <ellipse cx="90" cy="110" rx="20" ry="12" />
            <ellipse cx="330" cy="330" rx="80" ry="50" />
            <ellipse cx="330" cy="330" rx="52" ry="32" />
            <ellipse cx="330" cy="330" rx="24" ry="14" />
          </g>

          <path
            d={JOURNEY_PATH}
            stroke="white"
            strokeOpacity="0.25"
            strokeWidth="2"
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
          <path
            d={JOURNEY_PATH}
            pathLength={1}
            stroke="url(#journey-gradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="1"
            className="animate-draw-path"
          />

          <circle r="5" fill="#ffffff">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={JOURNEY_PATH}
              rotate="auto"
            />
          </circle>
          <circle r="11" fill="#8f95ff" fillOpacity="0.35">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={JOURNEY_PATH}
            />
          </circle>
        </svg>

        <Navigation className="absolute top-6 right-6 size-5 rotate-45 text-white/30" />
      </div>

      {milestones.map((milestone, i) => (
        <div
          key={milestone.label}
          className="animate-node-pop absolute"
          style={{
            left: toPercent(milestone.x),
            top: toPercent(milestone.y),
            animationDelay: `${400 + i * 450}ms`,
          }}
        >
          <div className="relative flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-brand-800 text-white shadow-lg shadow-brand-950/50 sm:size-12">
            <milestone.icon className="size-5" />
            <span
              className={cn(
                "absolute rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white backdrop-blur-md sm:text-xs",
                labelClasses[milestone.labelPosition],
              )}
            >
              {milestone.label}
            </span>
          </div>
        </div>
      ))}

      <div
        className="animate-node-pop absolute"
        style={{
          left: toPercent(destination.x),
          top: toPercent(destination.y),
          animationDelay: "2400ms",
        }}
      >
        <div className="relative">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-glow" />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-white text-brand-800 shadow-[0_0_40px_rgb(143_149_255/0.7)]">
            <GraduationCap className="size-8" />
          </div>
        </div>
      </div>

      <div className="animate-float absolute top-[4%] -left-3 w-48 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:-left-8 sm:w-52">
        <p className="flex items-center gap-1.5 text-xs text-brand-300">
          <Sparkles className="size-3.5 text-glow" />
          Learning journey
        </p>
        <p className="mt-1 text-sm font-semibold">Curriculum to classroom</p>
        <div className="mt-3 flex gap-1">
          {[1, 0.75, 0.5, 0.3].map((opacity) => (
            <span
              key={opacity}
              className="h-1.5 flex-1 rounded-full bg-glow"
              style={{ opacity }}
            />
          ))}
        </div>
      </div>

      <div
        className="animate-float absolute -right-8 bottom-[6%] hidden w-64 rounded-2xl bg-white p-4 text-brand-900 shadow-2xl sm:block"
        style={{ animationDelay: "-4s" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Learners succeed</p>
            <p className="text-xs text-muted-foreground">
              K-12 · Corporates · Industries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
