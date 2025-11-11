
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../ui/Card';
import { useData } from '../../hooks/useData';
import { Category, AbstractData, DailyEntry, Rates } from '../../types';
import { calculateMonthlySummary } from '../../services/summaryCalculator';
import Button from '../ui/Button';

const AbstractTable: React.FC<{ title: string; data: Record<Category, AbstractData>; unit: string; decimals: number; }> = ({ title, data, unit, decimals }) => {
    const total = {
        opening: data.balvatika.opening + data.primary.opening + data.middle.opening,
        received: data.balvatika.received + data.primary.received + data.middle.received,
        total: data.balvatika.total + data.primary.total + data.middle.total,
        consumed: (data.balvatika.consumed || 0) + (data.primary.consumed || 0) + (data.middle.consumed || 0),
        expenditure: (data.balvatika.expenditure || 0) + (data.primary.expenditure || 0) + (data.middle.expenditure || 0),
        balance: data.balvatika.balance + data.primary.balance + data.middle.balance,
    };
    const isCash = unit === '₹';
    const key = isCash ? 'expenditure' : 'consumed';
    const categories: Category[] = ['balvatika', 'primary', 'middle'];
    
    const thClasses = "p-2 border border-slate-300/50 dark:border-slate-600 whitespace-nowrap";
    const tdClasses = "p-2 border border-slate-300/50 dark:border-slate-600 whitespace-nowrap";

    return (
        <div>
            <h3 className="font-bold text-sky-700 dark:text-sky-400 mb-2">{title} ({unit})</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-300/50 dark:border-slate-600">
                <table className="min-w-[540px] w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100/60 dark:bg-slate-800/50">
                        <tr>
                            <th className={thClasses}>Category</th>
                            <th className={`${thClasses} text-right`}>Opening</th>
                            <th className={`${thClasses} text-right`}>Received</th>
                            <th className={`${thClasses} text-right`}>Total</th>
                            <th className={`${thClasses} text-right`}>{isCash ? 'Expend.' : 'Consumed'}</th>
                            <th className={`${thClasses} text-right`}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat}>
                                <td className={`${tdClasses} capitalize`}>{cat}</td>
                                <td className={`${tdClasses} text-right`}>{data[cat].opening.toFixed(decimals)}</td>
                                <td className={`${tdClasses} text-right`}>{data[cat].received.toFixed(decimals)}</td>
                                <td className={`${tdClasses} text-right`}>{data[cat].total.toFixed(decimals)}</td>
                                <td className={`${tdClasses} text-right`}>{data[cat][key]?.toFixed(decimals)}</td>
                                <td className={`${tdClasses} text-right font-semibold`}>{data[cat].balance.toFixed(decimals)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold bg-slate-200/50 dark:bg-slate-800">
                        <tr>
                            <td className={tdClasses}>Total</td>
                            <td className={`${tdClasses} text-right`}>{total.opening.toFixed(decimals)}</td>
                            <td className={`${tdClasses} text-right`}>{total.received.toFixed(decimals)}</td>
                            <td className={`${tdClasses} text-right`}>{total.total.toFixed(decimals)}</td>
                            <td className={`${tdClasses} text-right`}>{total[key].toFixed(decimals)}</td>
                            <td className={`${tdClasses} text-right`}>{total.balance.toFixed(decimals)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const CategoryAbstractTable: React.FC<{ title: string; data: AbstractData; unit: string; decimals: number; }> = ({ title, data, unit, decimals }) => {
    const isCash = unit === '₹';
    const key = isCash ? 'expenditure' : 'consumed';
    const thClasses = "p-2 border border-slate-300/50 dark:border-slate-600 whitespace-nowrap text-left";
    const tdClasses = "p-2 border border-slate-300/50 dark:border-slate-600 whitespace-nowrap text-right";

    return (
        <div className="flex-1">
            <h3 className="font-bold text-sky-700 dark:text-sky-400 mb-2">{title} ({unit})</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-300/50 dark:border-slate-600">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100/60 dark:bg-slate-800/50">
                        <tr>
                            <th className={thClasses}>Opening</th>
                            <th className={thClasses}>Received</th>
                            <th className={thClasses}>Total</th>
                            <th className={thClasses}>{isCash ? 'Expend.' : 'Consumed'}</th>
                            <th className={thClasses}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr className="bg-white dark:bg-slate-800/30">
                            <td className={tdClasses}>{data.opening.toFixed(decimals)}</td>
                            <td className={tdClasses}>{data.received.toFixed(decimals)}</td>
                            <td className={tdClasses}>{data.total.toFixed(decimals)}</td>
                            <td className={tdClasses}>{(data[key] || 0).toFixed(decimals)}</td>
                            <td className={`${tdClasses} font-bold text-sky-700 dark:text-sky-400`}>{data.balance.toFixed(decimals)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const SimpleDailyEntriesTable: React.FC<{ entries: any[] }> = ({ entries }) => (
    <div className="overflow-x-auto max-h-72">
        <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/60 dark:bg-slate-800/50 sticky top-0">
                <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2 text-right">Present</th>
                    <th className="p-2 text-right">Rice (kg)</th>
                    <th className="p-2 text-right">Cost (₹)</th>
                </tr>
            </thead>
            <tbody>
                {entries.length > 0 ? (
                    [...entries].reverse().map(entry => {
                        const date = new Date(entry.date + 'T00:00:00');
                        const isNoMealDay = entry.present === 0;
                        return (
                            <tr key={entry.id} className={`border-b border-slate-200/50 dark:border-slate-700 ${isNoMealDay ? 'bg-red-100/30 dark:bg-red-900/20' : ''}`}>
                                <td className="p-2">{date.toLocaleDateString('en-IN')}</td>
                                {isNoMealDay ? (
                                    <td colSpan={3} className="p-2 text-center text-red-700 dark:text-red-300 text-xs italic">
                                        {entry.reasonForNoMeal || 'No Meal Served'}
                                    </td>
                                ) : (
                                    <>
                                        <td className="p-2 text-right">{entry.present}</td>
                                        <td className="p-2 text-right">{entry.rice.toFixed(3)}</td>
                                        <td className="p-2 text-right">{entry.cost.toFixed(2)}</td>
                                    </>
                                )}
                            </tr>
                        )
                    })
                ) : (
                    <tr className="border-b border-slate-200/50 dark:border-slate-700">
                        <td colSpan={4} className="p-4 text-center text-slate-500 dark:text-slate-400">
                            No entries with meals served for this category in the selected month.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const DetailedConsumptionTable: React.FC<{
    entries: DailyEntry[];
    category: Category;
    rates: Rates;
    onRoll: number;
}> = ({ entries, category, rates, onRoll }) => {
    
    const { dailyData, totals } = useMemo(() => {
        const data = entries.map((entry, index) => {
            const present = entry.present[category];
            const mealServed = present > 0;
            
            const riceUsed = mealServed ? (present * rates.rice[category]) / 1000 : 0;
            const dalVeg = mealServed ? present * rates.dalVeg[category] : 0;
            const oilCond = mealServed ? present * rates.oilCond[category] : 0;
            const salt = mealServed ? present * rates.salt[category] : 0;
            const fuel = mealServed ? present * rates.fuel[category] : 0;
            const totalCost = mealServed ? dalVeg + oilCond + salt + fuel : 0;
            
            return {
                sNo: index + 1,
                date: entry.date,
                present: present,
                riceUsed,
                dalVeg,
                oilCond,
                salt,
                fuel,
                totalCost,
                reason: entry.reasonForNoMeal,
                isSunday: new Date(entry.date + 'T00:00:00').getDay() === 0,
            };
        });
        
        const totals = data.reduce((acc, day) => {
            acc.present += day.present;
            acc.riceUsed += day.riceUsed;
            acc.dalVeg += day.dalVeg;
            acc.oilCond += day.oilCond;
            acc.salt += day.salt;
            acc.fuel += day.fuel;
            acc.totalCost += day.totalCost;
            return acc;
        }, { present: 0, riceUsed: 0, dalVeg: 0, oilCond: 0, salt: 0, fuel: 0, totalCost: 0 });

        return { dailyData: data, totals };
    }, [entries, category, rates]);

    const thClasses = "p-2 whitespace-nowrap";
    const tdClasses = "p-2 whitespace-nowrap";
    
    return (
        <div className="overflow-x-auto rounded-lg border border-slate-300/50 dark:border-slate-600">
            <table className="min-w-[768px] w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100/60 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                        <th className={thClasses}>S.No</th>
                        <th className={thClasses}>Date</th>
                        <th className={`${thClasses} text-right`}>Roll</th>
                        <th className={`${thClasses} text-right`}>Present</th>
                        <th className={`${thClasses} text-right`}>Rice (kg)</th>
                        <th className={`${thClasses} text-right`}>Dal/Veg (₹)</th>
                        <th className={`${thClasses} text-right`}>Oil/Cond (₹)</th>
                        <th className={`${thClasses} text-right`}>Salt (₹)</th>
                        <th className={`${thClasses} text-right`}>Fuel (₹)</th>
                        <th className={`${thClasses} text-right`}>Total (₹)</th>
                        <th className={thClasses}>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {dailyData.map(day => {
                        const isNoMealDay = day.present === 0 || day.isSunday;
                        const reasonText = day.isSunday ? 'Sunday' : (day.reason || 'No Meal Served');

                        return (
                            <tr key={day.date} className={`border-b border-slate-200/50 dark:border-slate-700 ${isNoMealDay ? 'bg-red-100/30 dark:bg-red-900/20' : ''}`}>
                                {isNoMealDay ? (
                                     <td colSpan={11} className={`${tdClasses} text-center italic text-red-700 dark:text-red-300`}>
                                        {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN')} - {reasonText}
                                    </td>
                                ) : (
                                    <>
                                        <td className={tdClasses}>{day.sNo}</td>
                                        <td className={tdClasses}>{new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN')}</td>
                                        <td className={`${tdClasses} text-right`}>{onRoll}</td>
                                        <td className={`${tdClasses} text-right`}>{day.present}</td>
                                        <td className={`${tdClasses} text-right`}>{day.riceUsed.toFixed(3)}</td>
                                        <td className={`${tdClasses} text-right`}>{day.dalVeg.toFixed(2)}</td>
                                        <td className={`${tdClasses} text-right`}>{day.oilCond.toFixed(2)}</td>
                                        <td className={`${tdClasses} text-right`}>{day.salt.toFixed(2)}</td>
                                        <td className={`${tdClasses} text-right`}>{day.fuel.toFixed(2)}</td>
                                        <td className={`${tdClasses} text-right font-semibold`}>{day.totalCost.toFixed(2)}</td>
                                        <td className={tdClasses}>-</td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
                 <tfoot className="font-bold bg-slate-200/50 dark:bg-slate-800">
                    <tr>
                        <td colSpan={3} className={`${tdClasses} text-right`}>Total</td>
                        <td className={`${tdClasses} text-right`}>{totals.present}</td>
                        <td className={`${tdClasses} text-right`}>{totals.riceUsed.toFixed(3)}</td>
                        <td className={`${tdClasses} text-right`}>{totals.dalVeg.toFixed(2)}</td>
                        <td className={`${tdClasses} text-right`}>{totals.oilCond.toFixed(2)}</td>
                        <td className={`${tdClasses} text-right`}>{totals.salt.toFixed(2)}</td>
                        <td className={`${tdClasses} text-right`}>{totals.fuel.toFixed(2)}</td>
                        <td className={`${tdClasses} text-right`}>{totals.totalCost.toFixed(2)}</td>
                        <td className={tdClasses}>-</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

const MonthlySummary: React.FC = () => {
    const { data, saveMonthlyBalance } = useData();
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [view, setView] = useState<'overall' | Category>('overall');
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const { settings } = data;

    const summaryData = useMemo(
        () => calculateMonthlySummary(data, selectedMonth),
        [data.entries, data.receipts, data.monthlyBalances, data.settings, selectedMonth] // More specific dependencies
    );
    
    const { monthEntries, riceAbstracts, cashAbstracts, totals, categoryTotals, closingBalance } = summaryData;
    
    const onRoll = useMemo(() => {
        const totals = { balvatika: 0, primary: 0, middle: 0 };
        if (!settings.classRolls) return totals;

        settings.classRolls.forEach(c => {
            const classTotal = c.general.boys + c.general.girls + c.stsc.boys + c.stsc.girls;
            if (['bal', 'pp1', 'pp2'].includes(c.id)) {
                totals.balvatika += classTotal;
            } else if (['c1', 'c2', 'c3', 'c4', 'c5'].includes(c.id)) {
                totals.primary += classTotal;
            } else if (['c6', 'c7', 'c8'].includes(c.id)) {
                totals.middle += classTotal;
            }
        });
        return totals;
    }, [settings.classRolls]);

    useEffect(() => {
        if (closingBalance && monthEntries.length > 0) {
            saveMonthlyBalance(selectedMonth, closingBalance);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, closingBalance]); // Intentionally omitting saveMonthlyBalance

    useEffect(() => {
        setIsDetailsVisible(false);
    }, [view, selectedMonth]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMonth(e.target.value);
    };

    const displayedTotals = useMemo(() => {
        if (view === 'overall') {
            return {
                mealDays: monthEntries.filter(e => e.totalPresent > 0).length,
                present: totals.present,
                expenditure: totals.expenditure,
                rice: totals.rice,
            };
        }
        return {
            mealDays: monthEntries.filter(e => e.present[view] > 0).length,
            present: categoryTotals.present[view] || 0,
            expenditure: categoryTotals.expenditure[view] || 0,
            rice: categoryTotals.rice[view] || 0,
        };
    }, [view, monthEntries, totals, categoryTotals]);

    const simpleDisplayedEntries = useMemo(() => {
        if (view !== 'overall') return []; // Only needed for overall view
        return monthEntries.map(entry => ({
            id: entry.id,
            date: entry.date,
            present: entry.totalPresent,
            rice: entry.consumption.rice,
            cost: entry.consumption.total,
            reasonForNoMeal: entry.reasonForNoMeal
        }));
    }, [monthEntries, view]);

    return (
        <div className="space-y-4">
            <Card title="Monthly Summary">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="month-select" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Select Month</label>
                        <input
                            id="month-select"
                            type="month"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className="w-full bg-slate-100/60 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                     <div className="flex-1">
                        <label htmlFor="view-select" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">View</label>
                        <select
                            id="view-select"
                            value={view}
                            onChange={(e) => setView(e.target.value as any)}
                             className="w-full bg-slate-100/60 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-sky-500 focus:border-sky-500"
                        >
                            <option value="overall">Overall</option>
                            <option value="balvatika">Balvatika</option>
                            <option value="primary">Primary</option>
                            <option value="middle">Middle</option>
                        </select>
                    </div>
                </div>
            </Card>

            {monthEntries.length === 0 ? (
                <Card>
                    <p className="text-center text-slate-500 dark:text-slate-400">No entries found for the selected month.</p>
                </Card>
            ) : (
                <>
                    {view === 'overall' ? (
                        <Card title="Overall Summary">
                            <div className="space-y-4">
                                <AbstractTable title="Rice Abstract" data={riceAbstracts} unit="kg" decimals={3} />
                                <AbstractTable title="Cash Abstract" data={cashAbstracts} unit="₹" decimals={2} />
                            </div>
                        </Card>
                    ) : (
                        <Card title={`${view.charAt(0).toUpperCase() + view.slice(1)} Summary`}>
                            <div className="flex flex-col gap-4">
                                <CategoryAbstractTable title="Rice Abstract" data={riceAbstracts[view]} unit="kg" decimals={3} />
                                <CategoryAbstractTable title="Cash Abstract" data={cashAbstracts[view]} unit="₹" decimals={2} />
                            </div>
                        </Card>
                    )}

                    <Card title="Meal & Attendance Totals">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Meal Days</p>
                                <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{displayedTotals.mealDays}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Students Fed</p>
                                <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{displayedTotals.present}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Expenditure</p>
                                <p className="text-lg font-bold text-sky-700 dark:text-sky-400">₹{displayedTotals.expenditure.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Rice Used</p>
                                <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{displayedTotals.rice.toFixed(3)} kg</p>
                            </div>
                        </div>
                    </Card>

                    <Card title={view === 'overall' ? "Daily Entries for the Month" : "Daily Consumption Register"}>
                        {isDetailsVisible ? (
                            <>
                                {view === 'overall' ? (
                                   <SimpleDailyEntriesTable entries={simpleDisplayedEntries} />
                                ) : (
                                    <DetailedConsumptionTable
                                        entries={monthEntries}
                                        category={view}
                                        rates={settings.rates}
                                        onRoll={onRoll[view]}
                                    />
                                )}
                                <Button onClick={() => setIsDetailsVisible(false)} className="w-full mt-4" variant="secondary">
                                    Hide Details
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    {view === 'overall'
                                        ? "A detailed list of daily entries is available."
                                        : "A detailed day-by-day consumption register is available."
                                    }
                                </p>
                                <Button onClick={() => setIsDetailsVisible(true)}>
                                    {view === 'overall' ? 'Show Daily Breakdown' : 'Show Detailed Register'}
                                </Button>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
};

export default MonthlySummary;
