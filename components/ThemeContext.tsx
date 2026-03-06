'use client'
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ThemeContext = createContext({
  theme: 'light',
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
      settheme('light');
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
