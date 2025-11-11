
import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    zIndex?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, zIndex = 'z-50' }) => {
    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm ${zIndex}`} onClick={onClose}>
            <div className="bg-white dark:bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-200/50 dark:border-white/20 shadow-2xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200/50 dark:border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 dark:hover:text-white">&times;</button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
