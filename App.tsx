
import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './hooks/useData';
import { ThemeProvider } from './hooks/useTheme';
import { NotificationProvider } from './hooks/useNotifications';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './components/pages/Dashboard';
import MonthlySummary from './components/pages/MonthlySummary';
import Receipts from './components/pages/Receipts';
import Settings from './components/pages/Settings';
import Reports from './components/pages/Reports';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import ToastContainer from './components/ui/ToastContainer';
import LoginPage from './components/pages/LoginPage';
import SetupPage from './components/pages/SetupPage';
import WelcomePage from './components/pages/WelcomePage';
import { Page } from './types';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <DataProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </DataProvider>
        </ThemeProvider>
    );
};

const AppContent: React.FC = () => {
    const { data } = useData();
    const { isAuthenticated } = useAuth();
    
    useEffect(() => {
        const loader = document.getElementById('app-loader');
        if (loader) {
            // Start fade out animation
            loader.style.opacity = '0';
            
            // Remove the loader from the DOM after the transition is complete
            const handleTransitionEnd = () => {
                loader.remove();
                loader.removeEventListener('transitionend', handleTransitionEnd);
            };
            loader.addEventListener('transitionend', handleTransitionEnd);

            // As a fallback in case the event doesn't fire, remove it after a timeout
            setTimeout(() => {
                loader?.remove();
            }, 500); // This duration should match the CSS transition duration
        }
    }, []);

    const needsSetup = !data.auth?.password;

    if (needsSetup) {
        return <SetupPage />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }
    
    // If authenticated, but the welcome screen hasn't been shown, show it.
    if (data.welcomeScreenShown === false) {
        return <WelcomePage />;
    }
    
    return <AuthenticatedApp />;
};

const AuthenticatedApp: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        const initialPage = sessionStorage.getItem('initialPage') as Page | null;
        if (initialPage === 'settings') {
            sessionStorage.removeItem('initialPage'); // Consume the one-time flag
            return 'settings';
        }
        return 'dashboard'; // Default for all other sessions
    });

    const pages: Record<Page, React.ReactElement> = {
        dashboard: <Dashboard />,
        summary: <MonthlySummary />,
        receipts: <Receipts />,
        settings: <Settings />,
        reports: <Reports />,
    };

    const renderPage = () => pages[currentPage] || pages.dashboard;

    return (
        <NotificationProvider setCurrentPage={setCurrentPage}>
            <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans">
                {/* Background Blobs Layer */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="animated-blob blob-1 bg-sky-300 dark:bg-sky-900"></div>
                    <div className="animated-blob blob-2 bg-teal-300 dark:bg-teal-900"></div>
                </div>

                {/* Background Illustration Layer */}
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-0 opacity-10 dark:opacity-[0.02] bg-repeat"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                ></div>
                
                {/* Fixed Header Layer */}
                <div className="fixed top-0 left-0 right-0 z-20">
                    <div className="container mx-auto max-w-2xl p-2 sm:p-4">
                        <Header />
                    </div>
                </div>

                {/* Content Layer */}
                <div className="container mx-auto p-2 pb-28 max-w-2xl relative z-10 pt-28">
                    <main>
                        <div key={currentPage} className="page-transition-wrapper">
                            {renderPage()}
                        </div>
                    </main>
                </div>
                
                <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
            <ToastContainer />
        </NotificationProvider>
    );
};

export default App;