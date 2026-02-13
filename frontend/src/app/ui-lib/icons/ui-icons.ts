import {
  ArrowLeft,
  Award,
  Calculator,
  CircleCheckBig,
  CircleX,
  Image,
  Medal,
  Save,
  Settings,
  Shield,
  Table,
  Trophy,
  Upload,
  User,
  Users,
  type LucideIconData,
} from 'lucide-angular';

export const UI_ICONS = {
  arrowLeft: ArrowLeft,
  award: Award,
  calculator: Calculator,
  circleCheckBig: CircleCheckBig,
  circleX: CircleX,
  image: Image,
  medal: Medal,
  save: Save,
  settings: Settings,
  shield: Shield,
  table: Table,
  trophy: Trophy,
  upload: Upload,
  user: User,
  users: Users,
} as const satisfies Record<string, LucideIconData>;

export type UiIconName = keyof typeof UI_ICONS;
