import { Settings } from '../types';

export const validateSettings = (settings: Settings): string[] => {
    const errors: string[] = [];
    const { schoolDetails, mdmIncharge, classRolls, rates, cooks, healthStatus, inspectionReport, notificationSettings, mmeExpenditure } = settings;

    // 1. School Details
    if (!schoolDetails.name.trim()) errors.push('School Name is required.');
    if (!schoolDetails.state.trim()) errors.push('State is required.');
    if (!schoolDetails.district.trim()) errors.push('District is required.');
    if (!schoolDetails.block.trim()) errors.push('Block/Zone is required.');
    if (!schoolDetails.village.trim()) errors.push('Village/Ward is required.');
    if (!schoolDetails.schoolTypeMDCF) errors.push('School Type is required.');


    // 2. MDM Incharge
    if (!mdmIncharge.name.trim()) errors.push('MDM Incharge Name is required.');
    if (mdmIncharge.contact && !/^\d{10}$/.test(mdmIncharge.contact)) {
        errors.push('Contact Number must be exactly 10 digits.');
    }

    // 3. Class Rolls (check for negative numbers)
    classRolls.forEach(cr => {
        if (cr.general.boys < 0 || cr.general.girls < 0 || cr.stsc.boys < 0 || cr.stsc.girls < 0) {
            errors.push(`Enrollment numbers for ${cr.name} cannot be negative.`);
        }
    });

    // 4. Rates (check for negative numbers)
    for (const key in rates) {
        const rateCategory = rates[key as keyof typeof rates];
        if (rateCategory.balvatika < 0 || rateCategory.primary < 0 || rateCategory.middle < 0) {
            errors.push(`Rates for ${key} cannot be negative.`);
        }
    }

    // 5. MME Expenditure
    if (mmeExpenditure < 0) errors.push('MME Expenditure cannot be negative.');

    // 6. Cooks
    cooks.forEach((cook, index) => {
        if (!cook.name.trim()) errors.push(`Name for Cook #${index + 1} is required.`);
        if (cook.amountPaid < 0) errors.push(`Amount paid for ${cook.name || `Cook #${index + 1}`} cannot be negative.`);
    });
    
    // 7. Health & Inspection
    if (healthStatus.ifaBoys < 0 || healthStatus.ifaGirls < 0 || healthStatus.screenedByRBSK < 0 || healthStatus.referredByRBSK < 0) {
        errors.push('Health Status values cannot be negative.');
    }
    if (inspectionReport.incidentsCount < 0) errors.push('Incidents count cannot be negative.');
    
    // 8. Notifications
    if (notificationSettings.lowRiceThreshold < 0 || notificationSettings.lowCashThreshold < 0 || notificationSettings.backupReminderFrequency < 0) {
        errors.push('Notification settings values cannot be negative.');
    }


    return errors;
};