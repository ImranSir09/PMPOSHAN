import { AppData } from '../types';

const isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value);

// Helper to check properties of an object
const hasProperties = (obj: any, props: string[]): boolean => {
    if (!isObject(obj)) return false;
    return props.every(prop => prop in obj);
};

export const validateImportData = (data: any): { isValid: boolean; errors: string[]; summary: Record<string, string | number> } => {
    const errors: string[] = [];
    const summary: Record<string, string | number> = {
        schoolName: 'N/A',
        udise: 'N/A',
        entryCount: 0,
        receiptCount: 0,
    };

    if (!isObject(data)) {
        errors.push('Import file is not a valid JSON object.');
        return { isValid: false, errors, summary };
    }

    // 1. Validate top-level structure
    const requiredKeys: (keyof AppData)[] = ['settings', 'entries', 'receipts', 'monthlyBalances'];
    for (const key of requiredKeys) {
        if (!(key in data)) {
            errors.push(`File is missing required data section: "${key}".`);
        }
    }
    if (errors.length > 0) return { isValid: false, errors, summary };

    // 2. Deeper validation of 'settings'
    if (!isObject(data.settings) || !hasProperties(data.settings, ['schoolDetails', 'rates', 'classRolls'])) {
        errors.push('The "settings" section in the file is corrupted or incomplete.');
    } else {
        // Check schoolDetails
        if (!isObject(data.settings.schoolDetails) || typeof data.settings.schoolDetails.name !== 'string') {
             errors.push("Settings is missing a valid 'schoolDetails' object with a name.");
        } else {
             summary.schoolName = data.settings.schoolDetails.name || 'N/A';
             summary.udise = data.settings.schoolDetails.udise || 'N/A';
        }
       
        // Check rates
        if (!isObject(data.settings.rates) || !hasProperties(data.settings.rates, ['rice', 'dalVeg', 'fuel'])) {
             errors.push("Settings is missing a valid 'rates' object.");
        } else if (!isObject(data.settings.rates.rice) || typeof data.settings.rates.rice.primary !== 'number') {
             errors.push("Rate data for 'rice' is corrupted or incomplete.");
        }
        
        // Check classRolls
        if (!Array.isArray(data.settings.classRolls)) {
             errors.push("Settings is missing 'classRolls'.");
        }
    }

    // 3. Validate 'entries' array and its items
    if (!Array.isArray(data.entries)) {
        errors.push('The "entries" section is not a valid list.');
    } else {
        summary.entryCount = data.entries.length;
        if (data.entries.length > 0) {
            const firstEntry = data.entries[0];
            if (!hasProperties(firstEntry, ['id', 'date', 'present', 'consumption', 'totalPresent'])) {
                errors.push('Entries in the file have an invalid format.');
            } else if (!isObject(firstEntry.present) || !isObject(firstEntry.consumption)) {
                errors.push('Entry "present" or "consumption" data is corrupted.');
            }
        }
    }

    // 4. Validate 'receipts' array and its items
    if (!Array.isArray(data.receipts)) {
        errors.push('The "receipts" section is not a valid list.');
    } else {
        summary.receiptCount = data.receipts.length;
        if (data.receipts.length > 0) {
            const firstReceipt = data.receipts[0];
            if (!hasProperties(firstReceipt, ['id', 'date', 'rice', 'cash'])) {
                errors.push('Receipts in the file have an invalid format.');
            } else if (!isObject(firstReceipt.rice) || !isObject(firstReceipt.cash)) {
                errors.push('Receipt "rice" or "cash" data is corrupted.');
            }
        }
    }
    
    // 5. Validate 'monthlyBalances'
     if (!isObject(data.monthlyBalances)) {
        errors.push('The "monthlyBalances" section is corrupted or not an object.');
    }

    return { isValid: errors.length === 0, errors, summary };
};