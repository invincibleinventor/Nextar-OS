'use client';
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
interface props{
    children: ReactNode
}
const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => {},
}
);
export const useTheme = () => useContext(ThemeContext);
const setAppTheme = (theme:any) => {
  const html = document.documentElement;

  // Remove both themes first to ensure proper class assignment
  html.classList.remove('light', 'dark');
  html.classList.add(theme);

  // Ensure theme reflects immediately by triggering a manual CSS reflow (optional, but may help)
  html.style.transition = 'all 0.3s ease';
};


export const ThemeProvider = ({ children }:props) => {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDarkMode) {
      setTheme('dark');
    }
    setAppTheme(theme);
  }, [theme]);
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    setAppTheme(newTheme)
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
