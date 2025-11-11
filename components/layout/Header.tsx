
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
const AppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox='0 0 100 100' fill='none'><rect width='100' height='100' rx='20' fill='%230284c7'/><path d='M30 70C30 58.9543 38.9543 50 50 50C61.0457 50 70 58.9543 70 70' stroke='white' stroke-width='8' stroke-linecap='round'/><path d='M50 50V30' stroke='white' stroke-width='8' stroke-linecap='round'/><path d='M40 40L50 30L60 40' stroke='white' stroke-width='8' stroke-linecap='round'/></svg>;

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
                <div className="flex items-center space-x-3">
                    <div className="p-1 bg-sky-600 rounded-lg">
                        <AppIcon />
                    </div>
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
