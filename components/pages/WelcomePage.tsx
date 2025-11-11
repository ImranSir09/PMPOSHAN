
import React from 'react';
import { useData } from '../../hooks/useData';
import Card from '../ui/Card';
import Button from '../ui/Button';

const WelcomePage: React.FC = () => {
    const { markWelcomeAsShown } = useData();

    const handleContinue = () => {
        sessionStorage.setItem('initialPage', 'settings');
        markWelcomeAsShown();
    };

    return (
        <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="animated-blob blob-1 bg-sky-300 dark:bg-sky-900"></div>
                <div className="animated-blob blob-2 bg-teal-300 dark:bg-teal-900"></div>
            </div>

            {/* Content */}
            <div className="container mx-auto max-w-md relative z-10">
                <Card className="w-full text-center">
                    <div className="p-4">
                        <h1 className="text-2xl font-bold text-sky-700 dark:text-sky-400">Welcome to PM Poshan Pro!</h1>
                        <p className="mt-4 text-slate-600 dark:text-slate-300">
                            Thank you for choosing this app to manage your Mid-Day Meal records. I've designed it to be simple, reliable, and completely offline-first.
                        </p>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                            To get started, please take a moment to fill in your school's details in the settings. This is crucial for accurate reports.
                        </p>
                        
                        <div className="mt-6 text-xs pt-4 border-t border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400">
                            <p>If you have any questions or feedback, feel free to reach out.</p>
                            <p className="mt-2"><strong>- Imran Gani Mugloo</strong> (Developer)</p>
                            <p><a href="tel:+919149690096" className="text-sky-600 dark:text-sky-400 hover:underline">+91 9149690096</a></p>
                            <p><a href="mailto:emraanmugloo123@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">emraanmugloo123@gmail.com</a></p>
                        </div>

                        <div className="mt-8">
                            <Button onClick={handleContinue} className="w-full">
                                Let's Go to Settings
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default WelcomePage;
