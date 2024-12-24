'use client'
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const setAppTheme = (theme: string) => {
  const html = document.documentElement;

  html.classList.remove('light', 'dark');
  html.classList.add(theme);

  html.style.transition = 'all 0.3s ease';
};

export const ThemeProvider = ({ children }: Props) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Use stored theme if available; otherwise, use system preference
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDarkMode) {
      setTheme('dark');
    }
  }, []); // Run only once on initial load

  useEffect(() => {
    setAppTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]); // Apply theme whenever it changes

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
