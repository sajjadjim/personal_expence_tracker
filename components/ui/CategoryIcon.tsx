import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  GraduationCap,
  HeartPulse,
  Film,
  Home,
  Tag,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  PiggyBank,
  DollarSign,
  Wallet,
  CreditCard,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  BookOpen,
  Music,
  Dumbbell,
  Shield,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  GraduationCap,
  HeartPulse,
  Film,
  Home,
  Tag,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  PiggyBank,
  DollarSign,
  Wallet,
  CreditCard,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  BookOpen,
  Music,
  Dumbbell,
  Shield,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const AVAILABLE_COLORS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#ec4899', // pink
  '#ef4444', // red
  '#8b5cf6', // purple
  '#10b981', // green
  '#eab308', // yellow
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#64748b', // slate
  '#f43f5e', // rose
];

interface CategoryIconProps {
  iconName?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}

export function CategoryIcon({
  iconName,
  color = '#6366f1',
  size = 20,
  className = '',
}: CategoryIconProps) {
  const IconComponent = (iconName && ICON_MAP[iconName]) || HelpCircle;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg p-2 ${className}`}
      style={{
        backgroundColor: `${color || '#6366f1'}1A`, // 10% opacity for badge background
        color: color || '#6366f1',
      }}
    >
      <IconComponent size={size} />
    </div>
  );
}
