/**
 * Hook for theme management
 * 
 * Manages dark/light theme toggle for Dashboard V2 only
 * Theme is stored in localStorage
 * 
 * IMPORTANT: Dark theme is applied ONLY on Dashboard V2 page
 * When user navigates away, theme is reset to light
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [location] = useLocation();
  const isDashboardV2 = location === '/app/dashboard-v2';
  
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('dashboard-v2-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to light
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark theme ONLY when on Dashboard V2
    if (isDashboardV2 && theme === 'dark') {
      root.classList.add('dark');
    } else {
      // Always remove dark class when not on Dashboard V2 or theme is light
      root.classList.remove('dark');
    }
    
    // Save theme preference
    if (isDashboardV2) {
      localStorage.setItem('dashboard-v2-theme', theme);
    }
  }, [theme, isDashboardV2]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
