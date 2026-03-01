'use client'
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ThemeContext = createContext({
  theme: 'dark',
  toggletheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: Props) => {
  const [theme, settheme] = useState('light');
  const [mounted, setmounted] = useState(false);

  useEffect(() => {
    const storedtheme = localStorage.getItem('theme');

    if (storedtheme) {
      settheme(storedtheme);
    } else {
      // Default: dark for mobile, light for desktop
      const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
      settheme(isMobileDevice ? 'dark' : 'light');
    }
    setmounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggletheme = () => {
    const newtheme = theme === 'dark' ? 'light' : 'dark';
    settheme(newtheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggletheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
