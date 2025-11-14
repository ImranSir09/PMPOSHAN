import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useData';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from '../ui/NotificationPanel';
import { useAuth } from '../../hooks/useAuth';

const SystemIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const Header: React.FC = () => {
    const { data } = useData();
    const { theme, setTheme } = useTheme();
    const { logout } = useAuth();
    const { notifications, dismissNotification, dismissAllNotifications, handleNotificationAction } = useNotifications();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const ThemeIcon = () => {
        if (theme === 'light') return <SunIcon />;
        if (theme === 'dark') return <MoonIcon />;
        return <SystemIcon />;
    };
    
    const themeLabel = `Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`;

    return (
        <>
            {isPanelOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" 
                    onClick={() => setIsPanelOpen(false)}
                    aria-hidden="true"
                />
            )}
            <header className="relative z-40 flex items-center justify-between p-3 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-white/20 shadow-md">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEX////8/Pz9/f0AAAD6+vr4+Pj29vbe3t7l5eX09PTq6urj4+Pn5+e/v7/Pz8+urq7X19fi4uKnp6fNzc2zs7OJiYmysrKhoaF7e3uCgoJSUlJwcHCbm5uioqJcXFxISEhaWlq6urqVlZWBgYGEhIRqamo4Mh5RAAADVklEQVR4nO2c6XqiMBCGSRRCiCIiCrjits5s//93HLpTEy1wEULCOfNeL5O0B29hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE5sR6n/T4n0xJ7Lp+U6/T5Osy2zWZZN+tX9Q91T6tFaqT6N1L/VvdQ99R6l/rP1g37v/qvTf1r30P7V/qfO4e6x9R+pf4/dw51j6tV6u9sOaTe2+l3a+h+p344x5T6/Xo8l/rZPMa0en+L++F+Ma1ev5PzS71jXF3q354D6v+P+R8+P9Q/hY+X+o/zof4h9U/zof4h9U/zof4h9S/wn0P/Uf6H+KfY/+H+t/if2P8U+z+w/8P9b/E/sf8p9n9g/4f73+J/Yv9T7P/A/g/3v8X/xP6n2P+B/R/uf4v/if1Pse919f8H9v/1e6j3+tD22zTbdVp/J/s/sP/D/W/xP7H/KfZ/YP+H+9/if2L/U+z/wP4P97/F/8T+p9j/gX0f/2+V+p+k/s2l/m2V+h9L/R+V+u9U6n+h1P9aqf9lqv9pqu8p9Z+m+o5S/w+qf6v6+9T/VfV3qf9N9fep/03196n/TfX3qf9N9fep/031d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/d6r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/tVVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6lUvp/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/uPqfkv9pqv+J/b/N/i/o/z3qf2/977X/t+X+Fw71v8b+X2X/b+r/TfV3Uf93q/8bVf9NVf9lqv/VlUspqf52VS+p/a9V/9v8X9n9h/+eK/xP7v17/A/s/wv6v1//E/g/s/wj7v17/A/s/wv6v1//E/g/s/wj7P/A/hP0f6H+L/R/Y/4H+p9j/gX0f6H+L/R/Y/4H+p9j/gX0f6H+L/R/Y/4H+p9j/Qf1/gP0f1H8f2P8B/f8F/l/Q/674f1/+f1H/B/r/hP3/xP5/4f8H+v+c/b8t/2/J/zfp/8r0f6f6r1X9u/V/Zftv1/9z6//s/L/c/7PyP8r8d8b+W+P+X/D/jfyP5H8p/0/7d23/7v3/b/j/b/j/7/L/1/n/rfN/o/zf6v5X/P9P+5/hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh+L/8BlQd79tC3/GAAAAAAElFTkSuQmCC" alt="PM Poshan Logo" className="h-10 w-10 rounded-full" />
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{data.settings.schoolDetails.name}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-300">PM Poshan Pro</p>
                    </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsPanelOpen(prev => !prev)}
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Toggle notifications"
                        >
                            <BellIcon />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                                        {notifications.length}
                                    </span>
                                </span>
                            )}
                        </button>
                        {isPanelOpen && (
                            <NotificationPanel
                                notifications={notifications}
                                onDismiss={dismissNotification}
                                onDismissAll={dismissAllNotifications}
                                onAction={handleNotificationAction}
                                onClose={() => setIsPanelOpen(false)}
                            />
                        )}
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label={themeLabel}
                        title={themeLabel}
                    >
                        <ThemeIcon />
                    </button>
                    <button
                        onClick={logout}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Logout"
                        title="Logout"
                    >
                        <LogoutIcon />
                    </button>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{currentTime.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;