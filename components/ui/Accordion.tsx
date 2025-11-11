
import React, { useState, ReactNode, createContext, useContext } from 'react';

interface AccordionContextType {
    activeId: string | null;
    toggleItem: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType>({
    activeId: null,
    toggleItem: () => {},
});

export const Accordion: React.FC<{ children: ReactNode; defaultOpenId?: string | null }> = ({ children, defaultOpenId = null }) => {
    const [activeId, setActiveId] = useState<string | null>(defaultOpenId);
    
    const toggleItem = (id: string) => {
        setActiveId(prevId => (prevId === id ? null : id));
    };

    return <AccordionContext.Provider value={{ activeId, toggleItem }}>{children}</AccordionContext.Provider>;
};

export const AccordionItem: React.FC<{ id: string; title: ReactNode; children: ReactNode }> = ({ id, title, children }) => {
    const { activeId, toggleItem } = useContext(AccordionContext);
    const isOpen = activeId === id;

    return (
        <div className="bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300 shadow-sm">
            <button
                onClick={() => toggleItem(id)}
                className="w-full flex justify-between items-center p-4 text-left font-bold text-sky-700 dark:text-sky-400 text-base"
                aria-expanded={isOpen}
                aria-controls={`content-${id}`}
            >
                <span className="flex-1">{title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            <div
                id={`content-${id}`}
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-4 pt-2 border-t border-slate-200/50 dark:border-white/10">
                    {children}
                </div>
            </div>
        </div>
    );
};
