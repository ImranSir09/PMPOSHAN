

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useData } from './useData';
import { Notification, Page } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { calculateOverallBalance } from '../services/summaryCalculator';

interface NotificationContextType {
    notifications: Notification[];
    dismissNotification: (id: string) => void;
    dismissAllNotifications: () => void;
    handleNotificationAction: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode; setCurrentPage: (page: Page) => void }> = ({ children, setCurrentPage }) => {
    const { data } = useData();
    const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        const { settings, lastBackupDate } = data;
        const { notificationSettings } = settings;

        if (!notificationSettings?.enabled) {
            setActiveNotifications([]);
            return;
        }

        const potentialNotifications: Notification[] = [];

        // Low Stock
        const { currentRiceBalance, currentCashBalance } = calculateOverallBalance(data);
        const lowStockMessages = [];
        if (currentRiceBalance < (notificationSettings.lowRiceThreshold || 10)) {
            lowStockMessages.push(`Rice is low (${currentRiceBalance.toFixed(2)} kg).`);
        }
        if (currentCashBalance < (notificationSettings.lowCashThreshold || 500)) {
            lowStockMessages.push(`Cash is low (₹${currentCashBalance.toFixed(2)}).`);
        }
        if (lowStockMessages.length > 0) {
            potentialNotifications.push({
                id: 'low-stock',
                type: 'warning',
                title: 'Low Stock Warning',
                message: lowStockMessages.join(' '),
                page: 'receipts',
                actionLabel: 'Add Receipt',
            });
        }

        // Backup Reminder
        const isBackupOverdue = (() => {
            if (!lastBackupDate) return true;
            const lastBackup = new Date(lastBackupDate);
            const daysSinceBackup = (new Date().getTime() - lastBackup.getTime()) / (1000 * 3600 * 24);
            return daysSinceBackup > (notificationSettings.backupReminderFrequency || 30);
        })();
        if (isBackupOverdue) {
            potentialNotifications.push({
                id: 'backup-reminder',
                type: 'info',
                title: 'Data Backup Recommended',
                message: `Your last backup was over ${notificationSettings.backupReminderFrequency || 30} days ago.`,
                page: 'settings',
                actionLabel: 'Go to Settings',
            });
        }

        // Incomplete Settings
        const { schoolDetails, mdmIncharge, classRolls } = settings;
        const incompleteSetupMessages = [];
        if (!schoolDetails.name || schoolDetails.name === DEFAULT_SETTINGS.schoolDetails.name) incompleteSetupMessages.push('school name');
        if (!schoolDetails.udise) incompleteSetupMessages.push('UDISE code');
        if (!mdmIncharge.name) incompleteSetupMessages.push('MDM Incharge name');

        if (incompleteSetupMessages.length > 0) {
             potentialNotifications.push({
                id: 'incomplete-settings',
                type: 'setup',
                title: 'Complete Your Setup',
                message: `Key details are missing: ${incompleteSetupMessages.join(', ')}. Please update them.`,
                page: 'settings',
                actionLabel: 'Go to Settings',
            });
        }
        
        // Zero Enrollment
        const totalEnrollment = classRolls.reduce((sum, cr) => sum + cr.general.boys + cr.general.girls + cr.stsc.boys + cr.stsc.girls, 0);
        if (totalEnrollment === 0) {
             potentialNotifications.push({
                id: 'zero-enrollment',
                type: 'warning',
                title: 'No Students Enrolled',
                message: 'Student enrollment is zero. Update the roll statement for accurate calculations.',
                page: 'settings',
                actionLabel: 'Update Enrollment',
            });
        }
        
        // Missing Yesterday's Entry
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
        if (dayOfWeek !== 0 && dayOfWeek !== 1) { // Not Sunday or Monday
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            const yesterdayEntryExists = data.entries.some(e => e.id === yesterdayString);
            
            if (!yesterdayEntryExists) {
                 potentialNotifications.push({
                    id: `missing-entry-${yesterdayString}`,
                    type: 'warning',
                    title: 'Missing Entry',
                    message: `The meal entry for yesterday (${yesterday.toLocaleDateString('en-IN')}) was not found.`,
                    page: 'dashboard',
                    actionLabel: 'Add Yesterday\'s Entry',
                    actionPayload: { date: yesterdayString },
                });
            }
        }

        setActiveNotifications(potentialNotifications);
    }, [data]);
    
    const notifications = useMemo(() => {
        return activeNotifications.filter(n => !dismissedIds.includes(n.id));
    }, [activeNotifications, dismissedIds]);

    const dismissNotification = (id: string) => {
        setDismissedIds(prev => [...new Set([...prev, id])]);
    };

    const dismissAllNotifications = () => {
        const allIds = activeNotifications.map(n => n.id);
        setDismissedIds(prev => [...new Set([...prev, ...allIds])]);
    };

    const handleNotificationAction = (notification: Notification) => {
        if (notification.actionPayload?.date) {
            sessionStorage.setItem('openEntryForDate', notification.actionPayload.date);
        }
        setCurrentPage(notification.page);
        dismissNotification(notification.id);
    };

    return (
        <NotificationContext.Provider value={{ notifications, dismissNotification, dismissAllNotifications, handleNotificationAction }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
