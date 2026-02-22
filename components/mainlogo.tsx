'use client';
import { useTheme } from './ThemeContext';

export default function Logo() {
  const { theme } = useTheme();
  return (
    <img
      src={theme === 'dark' ? '/logo-white.svg' : '/logo.svg'}
      alt="NextarOS Logo"
      className="w-4 h-4"
    />
  );
}
