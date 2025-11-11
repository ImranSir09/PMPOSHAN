
import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-slate-700 shadow-lg p-4 ${className}`}>
            {title && <h2 className="text-lg font-bold text-sky-800 dark:text-sky-300 mb-4">{title}</h2>}
            {children}
        </div>
    );
};

export default Card;
