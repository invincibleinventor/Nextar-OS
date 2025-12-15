'use client'
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ThemeContext = createContext({
  theme: 'light',
  toggletheme: () => { },
});

export const usetheme = () => useContext(ThemeContext);

const setapptheme = (theme: string) => {
  const html = document.documentElement;

  html.classList.remove('light', 'dark');
  html.classList.add(theme);

  html.classList.remove('light', 'dark');
  html.classList.add(theme);
};

export const ThemeProvider = ({ children }: Props) => {
  const [theme, settheme] = useState('light');

  useEffect(() => {
    const storedtheme = localStorage.getItem('theme');
    const prefersdarkmode = window.matchMedia('(prefers-color-scheme: dark)').matches;


    if (storedtheme) {
      settheme(storedtheme);
    } else if (prefersdarkmode) {
      settheme('dark');
    }
  }, []);

  useEffect(() => {
    setapptheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
