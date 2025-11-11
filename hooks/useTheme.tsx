
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Toggle .dark on <html> for Tailwind's dark: variants to work everywhere
    root.classList.toggle('dark', isDark);

    // Explicitly set body background class for robustness
    body.classList.remove('bg-slate-50', 'bg-slate-900');
    body.classList.add(isDark ? 'bg-slate-900' : 'bg-slate-50');

    // Ensure transition classes are present
    if (!body.classList.contains('transition-colors')) {
        body.classList.add('transition-colors', 'duration-500');
    }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('pm-poshan-theme') as Theme | null;
        return savedTheme || 'system';
    });

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('pm-poshan-theme', theme);
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            // Re-apply theme only if component is still in 'system' mode
            const currentTheme = localStorage.getItem('pm-poshan-theme') as Theme | null;
            if (currentTheme === 'system') {
                applyTheme('system');
            }
        };
        
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
