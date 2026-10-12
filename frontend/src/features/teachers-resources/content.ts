import {
  Layers,
  Medal,
  RefreshCw,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

type Program = {
  icon: LucideIcon;
  title: string;
};

export const programs: Program[] = [
  { icon: Layers, title: "Integrated Program" },
  { icon: TrendingUp, title: "Advanced Program" },
  { icon: RefreshCw, title: "Revised Advanced Program" },
  { icon: Trophy, title: "Olympiad Program" },
  { icon: Medal, title: "Olympiad Program Class 1 to 5" },
];
