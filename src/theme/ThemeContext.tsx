import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, Palette, ThemeName } from './tokens';
import { useAppStore } from '../store/useAppStore';

interface ThemeValue {
  theme: ThemeName;
  colors: Palette;
}

const ThemeContext = createContext<ThemeValue>({ theme: 'light', colors: palettes.light });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useAppStore((s) => s.themePreference);
  const theme: ThemeName =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(() => ({ theme, colors: palettes[theme] }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
