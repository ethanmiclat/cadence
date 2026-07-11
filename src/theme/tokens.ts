export type ThemeName = 'light' | 'dark';

export interface Palette {
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  protein: string;
  carbs: string;
  fat: string;
  track: string;
}

export const palettes: Record<ThemeName, Palette> = {
  light: {
    bg: '#F7F7F4',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    border: '#E8E8E2',
    borderStrong: '#D6D6CE',
    text: '#191B1A',
    textSecondary: '#5C615E',
    textFaint: '#8B918D',
    accent: '#0E8A5F',
    accentSoft: '#E3F2EB',
    onAccent: '#FFFFFF',
    warn: '#B87614',
    warnSoft: '#F7EDDC',
    danger: '#C24A3F',
    dangerSoft: '#F8E7E4',
    protein: '#0E8A5F',
    carbs: '#B87614',
    fat: '#5B6BB5',
    track: '#ECECE6',
  },
  dark: {
    bg: '#101312',
    surface: '#181C1A',
    surfaceRaised: '#1F2422',
    border: '#272C2A',
    borderStrong: '#343B38',
    text: '#EDEFEC',
    textSecondary: '#A4ACA7',
    textFaint: '#6E756F',
    accent: '#3ECF8E',
    accentSoft: '#1A2B24',
    onAccent: '#0B1410',
    warn: '#D9A24B',
    warnSoft: '#2B2418',
    danger: '#D9776C',
    dangerSoft: '#2C1D1B',
    protein: '#3ECF8E',
    carbs: '#D9A24B',
    fat: '#8B9AE0',
    track: '#252A28',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, lineHeight: 38 },
  title: { fontFamily: fonts.semibold, fontSize: 22, letterSpacing: -0.4, lineHeight: 28 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.2, lineHeight: 16 },
  statLarge: { fontFamily: fonts.monoBold, fontSize: 34, letterSpacing: -1, lineHeight: 40 },
  stat: { fontFamily: fonts.monoBold, fontSize: 20, letterSpacing: -0.5, lineHeight: 26 },
  statSmall: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
} as const;
