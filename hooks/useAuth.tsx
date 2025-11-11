
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useData } from './useData';
import { AuthData } from '../types';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    setupAccount: (authData: AuthData) => void;
    resetPassword: (answer: string, newPass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data, updateAuth, setupAccountData } = useData();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const sessionActive = sessionStorage.getItem('pm-poshan-auth') === 'true';
        if (sessionActive) {
            setIsAuthenticated(true);
        }
    }, []);

    const login = (password: string): boolean => {
        if (data.auth?.password === password) {
            setIsAuthenticated(true);
            sessionStorage.setItem('pm-poshan-auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('pm-poshan-auth');
    };

    const setupAccount = (authData: AuthData) => {
        setupAccountData(authData);
        setIsAuthenticated(true);
        sessionStorage.setItem('pm-poshan-auth', 'true');
    };
    
    const resetPassword = (answer: string, newPass: string): boolean => {
        if (data.auth && data.auth.securityAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
            updateAuth({ ...data.auth, password: newPass });
            return true;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, setupAccount, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};