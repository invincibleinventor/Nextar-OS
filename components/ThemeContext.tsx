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
  if (theme === 'dark') {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  } else {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  }
};

// ThemeProvider component to wrap the application
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
    localStorage.setItem('theme', newTheme); // Persist theme in localStorage
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
