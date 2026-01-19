/**
 * Hook for theme management
 * 
 * Manages global dark/light theme toggle
 * Theme is stored in localStorage and applied globally
 */

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('app-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to light
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme globally
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme preference
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
