
import React, { ReactNode } from 'react';
import Card from './Card';
import Button from './Button';

interface AlertCardProps {
    title: string;
    children: ReactNode;
    onDismiss: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const AlertCard: React.FC<AlertCardProps> = ({ title, children, onDismiss, action }) => {
    return (
        <Card className="!p-0 border-l-4 border-yellow-400 bg-yellow-500/10 dark:bg-yellow-900/20">
            <div className="p-3">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-bold text-yellow-300">{title}</h3>
                        <div className="mt-1 text-xs text-yellow-200/80">
                            {children}
                        </div>
                         {action && (
                            <div className="mt-3">
                                <Button onClick={action.onClick} className="!px-3 !py-1 !text-xs" variant="secondary">
                                    {action.label}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button onClick={onDismiss} className="inline-flex rounded-md p-1.5 text-yellow-200/60 hover:text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default AlertCard;
