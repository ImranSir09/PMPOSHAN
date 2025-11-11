
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, containerClassName = '', className, ...props }) => {
    const baseClasses = "w-full bg-slate-100/60 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5 placeholder-slate-500 dark:placeholder-slate-400";
    return (
        <div className={containerClassName}>
            <label htmlFor={id} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {label}
            </label>
            <input id={id} className={`${baseClasses} ${className || ''}`} {...props} />
        </div>
    );
};

export default Input;
