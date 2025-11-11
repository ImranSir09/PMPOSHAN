import { AppData, MonthlyBalanceData, Category, AbstractData } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// FIX: Replaced getOpeningBalanceForMonth with a more robust function that also returns
// the key of the last saved month. This is crucial for correctly calculating receipts
// over periods with no daily entries.
export const getOpeningBalanceInfo = (data: AppData, selectedMonth: string): { balance: MonthlyBalanceData; lastBalanceMonth: string | null } => {
    const allBalanceKeys = Object.keys(data.monthlyBalances).sort().reverse();
    // Find the most recent month key that is strictly BEFORE the selected month.
    const previousBalanceKey = allBalanceKeys.find(key => key < selectedMonth);

    if (previousBalanceKey) {
        return { balance: data.monthlyBalances[previousBalanceKey], lastBalanceMonth: previousBalanceKey };
    }
    
    // If no previous balance is found, use the initial opening balance from settings.
    return { 
        balance: data.settings.initialOpeningBalance || { 
            rice: { balvatika: 0, primary: 0, middle: 0 },
            cash: { balvatika: 0, primary: 0, middle: 0 },
        }, 
        lastBalanceMonth: null 
    };
};

// NEW: Helper to get the next month's key string (e.g., '2024-05' -> '2024-06')
const getNextMonthKey = (monthKey: string): string => {
    const [year, month] = monthKey.split('-').map(Number);
    // Use UTC to avoid timezone-related issues when incrementing month.
    const date = new Date(Date.UTC(year, month - 1, 1));
    date.setUTCMonth(date.getUTCMonth() + 1);
    const nextYear = date.getUTCFullYear();
    const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
};

export const calculateMonthlySummary = (data: AppData, selectedMonth: string) => {
    const entries = data.entries.filter(e => e.date.startsWith(selectedMonth));
    // FIX: Add a fallback to default rates to prevent calculation errors if settings are corrupted or missing.
    const rates = data.settings.rates || DEFAULT_SETTINGS.rates;
    const categories: Category[] = ['balvatika', 'primary', 'middle'];
    
    // FIX: Use the new helper to get both the opening balance and the month it corresponds to.
    const { balance: openingBalance, lastBalanceMonth } = getOpeningBalanceInfo(data, selectedMonth);

    // If the last balance was from May ('2024-05'), we need receipts from June ('2024-06') onwards.
    // If there's no prior balance, we start from an early date to include all receipts.
    const receiptStartDate = lastBalanceMonth ? getNextMonthKey(lastBalanceMonth) : '0000-00';

    const received = data.receipts
        // FIX: The core of the bug fix. Filter receipts from the month AFTER the last saved balance,
        // up to and including the currently selected month. This correctly accumulates receipts
        // across any months that had no meal entries.
        .filter(r => r.date.substring(0, 7) >= receiptStartDate && r.date.substring(0, 7) <= selectedMonth)
        .reduce((acc, r) => {
            categories.forEach(cat => {
                acc.rice[cat] += r.rice[cat];
                acc.cash[cat] += r.cash[cat];
            });
            return acc;
        }, {
            rice: { balvatika: 0, primary: 0, middle: 0 },
            cash: { balvatika: 0, primary: 0, middle: 0 },
        });

    const categoryTotals = {
        present: { balvatika: 0, primary: 0, middle: 0 },
        rice: { balvatika: 0, primary: 0, middle: 0 },
        expenditure: { balvatika: 0, primary: 0, middle: 0 },
    };
    
    const expenditureBreakdown = {
        dalVeg: 0,
        oilCond: 0,
        salt: 0,
        fuel: 0,
    };

    entries.forEach(entry => {
        categories.forEach(cat => {
            const present = entry.present[cat] || 0;
            categoryTotals.present[cat] += present;
            
            // FIX: Ensure each rate category exists before using it to prevent NaN errors.
            const dailyExp = {
                dalVeg: present * (rates.dalVeg?.[cat] || 0),
                oilCond: present * (rates.oilCond?.[cat] || 0),
                salt: present * (rates.salt?.[cat] || 0),
                fuel: present * (rates.fuel?.[cat] || 0),
            };
            
            expenditureBreakdown.dalVeg += dailyExp.dalVeg;
            expenditureBreakdown.oilCond += dailyExp.oilCond;
            expenditureBreakdown.salt += dailyExp.salt;
            expenditureBreakdown.fuel += dailyExp.fuel;
            
            categoryTotals.expenditure[cat] += dailyExp.dalVeg + dailyExp.oilCond + dailyExp.salt + dailyExp.fuel;
            categoryTotals.rice[cat] += (present * (rates.rice?.[cat] || 0)) / 1000;
        });
    });

    categories.forEach(cat => {
        categoryTotals.expenditure[cat] = parseFloat(categoryTotals.expenditure[cat].toFixed(2));
        categoryTotals.rice[cat] = parseFloat(categoryTotals.rice[cat].toFixed(3));
    });

    const totalExpenditure = categoryTotals.expenditure.balvatika + categoryTotals.expenditure.primary + categoryTotals.expenditure.middle;
    const totalRice = categoryTotals.rice.balvatika + categoryTotals.rice.primary + categoryTotals.rice.middle;
    const totalPresent = categoryTotals.present.balvatika + categoryTotals.present.primary + categoryTotals.present.middle;
    
    const totals = {
        present: totalPresent,
        rice: parseFloat(totalRice.toFixed(3)),
        expenditure: parseFloat(totalExpenditure.toFixed(2)),
    };

    const riceAbstracts: Record<Category, AbstractData> = {} as any;
    const cashAbstracts: Record<Category, AbstractData> = {} as any;
    
    categories.forEach(cat => {
        const riceOpening = openingBalance.rice?.[cat] || 0;
        const riceReceived = received.rice?.[cat] || 0;
        const riceConsumed = categoryTotals.rice?.[cat] || 0;

        riceAbstracts[cat] = {
            opening: riceOpening,
            received: riceReceived,
            total: riceOpening + riceReceived,
            consumed: riceConsumed,
            balance: riceOpening + riceReceived - riceConsumed,
        };
        
        const cashOpening = openingBalance.cash?.[cat] || 0;
        const cashReceived = received.cash?.[cat] || 0;
        const cashExpenditure = categoryTotals.expenditure?.[cat] || 0;

        cashAbstracts[cat] = {
            opening: cashOpening,
            received: cashReceived,
            total: cashOpening + cashReceived,
            expenditure: cashExpenditure,
            balance: cashOpening + cashReceived - cashExpenditure,
        };
    });

    const closingBalance: MonthlyBalanceData = {
        rice: { balvatika: riceAbstracts.balvatika.balance, primary: riceAbstracts.primary.balance, middle: riceAbstracts.middle.balance },
        cash: { balvatika: cashAbstracts.balvatika.balance, primary: cashAbstracts.primary.balance, middle: cashAbstracts.middle.balance },
    };
    
    return { monthEntries: entries, riceAbstracts, cashAbstracts, totals, categoryTotals, closingBalance, expenditureBreakdown };
};

export const calculateOverallBalance = (data: AppData) => {
    const { settings, receipts, entries } = data;
    const initial = settings.initialOpeningBalance;

    const totalReceived = receipts.reduce((acc, r) => {
        acc.rice += r.rice.balvatika + r.rice.primary + r.rice.middle;
        acc.cash += r.cash.balvatika + r.cash.primary + r.cash.middle;
        return acc;
    }, { rice: 0, cash: 0 });

    const totalConsumed = entries.reduce((acc, e) => {
        acc.rice += e.consumption.rice;
        acc.cash += e.consumption.total;
        return acc;
    }, { rice: 0, cash: 0 });
    
    const totalInitialRice = (initial?.rice?.balvatika || 0) + (initial?.rice?.primary || 0) + (initial?.rice?.middle || 0);
    const totalInitialCash = (initial?.cash?.balvatika || 0) + (initial?.cash?.primary || 0) + (initial?.cash?.middle || 0);

    const currentRiceBalance = totalInitialRice + totalReceived.rice - totalConsumed.rice;
    const currentCashBalance = totalInitialCash + totalReceived.cash - totalConsumed.cash;

    return { currentRiceBalance, currentCashBalance };
};