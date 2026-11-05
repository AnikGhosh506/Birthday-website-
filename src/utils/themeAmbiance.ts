export type AmbianceTheme = 'sunrise-gold' | 'sunset-rose' | 'midnight-indigo';

export interface AmbianceThemeConfig {
  id: AmbianceTheme;
  label: string;
  shortLabel: string;
  description: string;
  swatchGradient: string;
  accentColor: string;
}

export const AMBIANCE_THEMES: AmbianceThemeConfig[] = [
  {
    id: 'sunrise-gold',
    label: 'Sunrise Gold',
    shortLabel: 'Sunrise',
    description: 'Warm champagne sunbeams & gilded linen texture',
    swatchGradient: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 55%, #d97706 100%)',
    accentColor: '#d97706',
  },
  {
    id: 'sunset-rose',
    label: 'Sunset Rose',
    shortLabel: 'Sunset',
    description: 'Blushing twilight petals & silk rose grain texture',
    swatchGradient: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 50%, #e11d48 100%)',
    accentColor: '#e11d48',
  },
  {
    id: 'midnight-indigo',
    label: 'Midnight Indigo',
    shortLabel: 'Midnight',
    description: 'Starlit celestial sapphire & velvet stardust texture',
    swatchGradient: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 55%, #0f172a 100%)',
    accentColor: '#6366f1',
  },
];

export const THEME_STORAGE_KEY = 'amore_ambiance_theme_v1';
