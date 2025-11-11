
import React, { useState, useEffect } from 'react';
import { TOAST_EVENT, ToastMessage, ToastType } from '../../hooks/useToast';

const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: string) => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [message.id, onDismiss]);
    
    const typeClasses: Record<ToastType, string> = {
        success: 'from-green-500/80 to-green-600/80 border-green-400',
        error: 'from-red-500/80 to-red-600/80 border-red-400',
        info: 'from-sky-500/80 to-sky-600/80 border-sky-400',
    }

    return (
        <div 
            className={`w-full max-w-sm p-3 rounded-lg shadow-lg text-white text-sm font-semibold bg-gradient-to-r ${typeClasses[message.type]} border-l-4 backdrop-blur-md`}
            onClick={() => onDismiss(message.id)}
        >
            {message.message}
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleShowToast = (event: Event) => {
            const customEvent = event as CustomEvent<ToastMessage>;
            setToasts(prevToasts => [customEvent.detail, ...prevToasts]);
        };

        window.addEventListener(TOAST_EVENT, handleShowToast);
        return () => window.removeEventListener(TOAST_EVENT, handleShowToast);
    }, []);

    const dismissToast = (id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast} onDismiss={dismissToast} />
            ))}
        </div>
    );
};

export default ToastContainer;
