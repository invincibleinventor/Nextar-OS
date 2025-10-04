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

  
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDarkMode) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    setAppTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
