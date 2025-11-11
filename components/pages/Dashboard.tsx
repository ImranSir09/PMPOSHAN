
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import Card from '../ui/Card';
import { useData } from '../../hooks/useData';
import { DailyEntry } from '../../types';
import { useToast } from '../../hooks/useToast';
import IllustrationCard from '../ui/IllustrationCard';
import Skeleton from '../ui/Skeleton';
import DailyEntryPage from './DailyEntry';
import { calculateMonthlySummary } from '../../services/summaryCalculator';

const Dashboard: React.FC = () => {
    const { data } = useData();
    const { showToast } = useToast();
    const { settings } = data;
    const { mdmIncharge } = settings;

    const [isLoading, setIsLoading] = useState(true);

    // Daily Entry Reminder
    useEffect(() => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const entryExists = data.entries.some(e => e.id === todayStr);

        if (!entryExists && now.getHours() >= 15) { // 3 PM or later
            showToast("Reminder: Don't forget to add today's meal entry.", 'info');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const displayedMonthKey = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const dashboardData = useMemo(() => {
        const summary = calculateMonthlySummary(data, displayedMonthKey);
        const { totals, monthEntries } = summary;

        const entriesMap = new Map<string, DailyEntry>();
        for (const entry of monthEntries) {
            entriesMap.set(entry.id, entry);
        }

        const currentDate = new Date(displayedMonthKey + '-02T00:00:00');
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const chartData: { name: string, date: Date, balvatika: number, primary: number, middle: number, total: number }[] = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const entry = entriesMap.get(dateString);
            
            chartData.push({
                name: `${i}`,
                date: date,
                balvatika: entry?.present.balvatika || 0,
                primary: entry?.present.primary || 0,
                middle: entry?.present.middle || 0,
                total: entry?.totalPresent || 0,
            });
        }

        return {
            totalExpenditure: totals.expenditure,
            totalRice: totals.rice,
            mealDays: monthEntries.filter(e => e.totalPresent > 0).length,
            monthlyData: chartData
        };
    }, [data.entries, data.settings, displayedMonthKey, data.receipts, data.monthlyBalances]); // More specific dependencies
    
    // Manage loading state based on when dashboardData is computed
    useEffect(() => {
        if (dashboardData) {
            setIsLoading(false);
        }
    }, [dashboardData]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // FIX: Check if payload and its properties exist to prevent runtime errors.
            const isSunday = payload[0]?.payload?.date?.getDay() === 0;
            return (
                <div className="bg-white/80 dark:bg-slate-800/80 p-2 border border-slate-200/50 dark:border-slate-600 rounded text-xs shadow-lg backdrop-blur-sm">
                    <p className="label text-slate-700 dark:text-slate-300 font-semibold">
                        {`Date: ${label}`}
                        {isSunday && <span className="text-red-500 ml-1">(Sunday)</span>}
                    </p>
                    <p style={{ color: '#94a3b8' }}>{`Balvatika: ${payload[0].value}`}</p>
                    <p style={{ color: '#0ea5e9' }}>{`Primary: ${payload[1].value}`}</p>
                    <p style={{ color: '#2dd4bf' }}>{`Middle: ${payload[2].value}`}</p>
                    <p className="font-bold text-slate-800 dark:text-white">{`Total: ${payload[0].payload.total}`}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-72" />
                <Skeleton className="h-24" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <IllustrationCard inchargeName={mdmIncharge?.name} inchargeContact={mdmIncharge?.contact} />

            <DailyEntryPage />

            <Card title="This Month's Totals" className="relative overflow-hidden">
                <div aria-hidden="true" className="absolute -bottom-2 -right-2 text-sky-500/10 dark:text-sky-500/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 20.5c0 .8.6 1.5 1.5 1.5h1c.8 0 1.5-.7 1.5-1.5v-1c0-.8-.7-1.5-1.5-1.5h-1c-.8 0-1.5.7-1.5 1.5v1Z"/>
                        <path d="M8 12h.01"/>
                        <path d="M19.1 7.4c-1-1.5-2.6-2.4-4.3-2.4H9.2C6 5 5 8 5 9.2c0 .8 0 1.2.1 1.5"/>
                        <path d="M21 12c-1.2-1-2.9-1.2-4.2-.8"/>
                        <path d="M5.3 12.8c-1.2.4-2.1 1.4-2.3 2.7-1.3 7.1 5.3 10.5 7 10.5h1.2c1.5 0 2.8-.4 4-1.2 1.3-1 2.3-2.4 2.8-4"/>
                    </svg>
                </div>
                <div className="relative grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Meal Days</p>
                        <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{dashboardData.mealDays}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Expenditure</p>
                        <p className="text-lg font-bold text-sky-700 dark:text-sky-400">₹{dashboardData.totalExpenditure.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Rice</p>
                        <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{dashboardData.totalRice.toFixed(3)} kg</p>
                    </div>
                </div>
            </Card>
            
            <Card title="Daily Attendance" className="relative overflow-hidden">
                <div aria-hidden="true" className="absolute -bottom-2 -right-2 text-sky-500/10 dark:text-sky-500/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <div className="relative">
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={dashboardData.monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" interval={0} tick={{ fill: '#64748b', fontSize: 8 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} className="dark:tick={{ fill: '#9ca3af' }} dark:axisLine={{ stroke: '#475569' }} dark:tickLine={{ stroke: '#475569' }}" />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} className="dark:tick={{ fill: '#9ca3af' }} dark:axisLine={{ stroke: '#475569' }} dark:tickLine={{ stroke: '#475569' }}" />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />

                                {/* Add faint reference lines for Sundays with no attendance to make them noticeable */}
                                {dashboardData.monthlyData.map((entry, index) => {
                                    if (entry.date.getDay() === 0 && entry.total === 0) {
                                        return <ReferenceLine key={`sunday-ref-${index}`} x={entry.name} stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="2 2" />;
                                    }
                                    return null;
                                })}

                                <Bar dataKey="balvatika" stackId="a" fill="#94a3b8" radius={[5, 5, 0, 0]} barSize={10} >
                                     {dashboardData.monthlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.date.getDay() === 0 ? '#f87171' : '#94a3b8'} />
                                    ))}
                                </Bar>
                                <Bar dataKey="primary" stackId="a" fill="#0ea5e9" barSize={10}>
                                    {dashboardData.monthlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.date.getDay() === 0 ? '#f87171' : '#0ea5e9'} />
                                    ))}
                                </Bar>
                                 <Bar dataKey="middle" stackId="a" fill="#2dd4bf" radius={[5, 5, 0, 0]} barSize={10}>
                                    {dashboardData.monthlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.date.getDay() === 0 ? '#f87171' : '#2dd4bf'} />
                                    ))}
                                 </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="flex justify-center items-center space-x-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#94a3b8] mr-1"></div>Balvatika</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#0ea5e9] mr-1"></div>Primary</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#2dd4bf] mr-1"></div>Middle</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-[#f87171] mr-1"></div>Sunday</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
