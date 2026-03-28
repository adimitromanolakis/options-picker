import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { themes, type Theme, type ThemeName } from './themes';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  toggleTheme: () => void;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.dark,
  themeName: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('dark');

  const toggleTheme = useCallback(() => {
    setThemeName((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({
    theme: themes[themeName],
    themeName,
    toggleTheme,
    setTheme: setThemeName,
  }), [themeName, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
