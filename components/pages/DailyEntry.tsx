
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useData } from '../../hooks/useData';
import { DailyEntry } from '../../types';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import NumberInput from '../ui/NumberInput';
import Input from '../ui/Input';

const NO_MEAL_REASONS_STRUCTURED = {
  "Foodgrains not Available": [
    "Foodgrains not received",
    "Foodgrains damaged",
    "Insufficient foodgrains"
  ],
  "Cook not Available": [
    "Cook not appointed",
    "Cook Salary not Paid",
    "Cook quitted"
  ],
  "Fuel/Ingredients not Available": [
    "Insufficient Fuel",
    "Insufficient Funds for Cooking",
    "Insufficient Ingredients"
  ],
  "Packages not arrived from NGO/SHG": [
    "Vendor not Received Payment",
    "Damaged in Transit"
  ],
  "Holiday in School": [
    "Gazetted Holiday",
    "Local Holiday",
    "Closed (Natural Calamity)",
    "Winter Vacations",
    "Summer Vacations",
    "Festival Break"
  ],
  "Others": [
    "Others"
  ]
};
type MainReason = keyof typeof NO_MEAL_REASONS_STRUCTURED;
const MAIN_REASONS = Object.keys(NO_MEAL_REASONS_STRUCTURED) as MainReason[];

const DailyEntryPage: React.FC = () => {
    const { data, addEntry } = useData();
    const { showToast } = useToast();
    const { settings } = data;
    const { rates } = settings;

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
    
    const today = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const [selectedDate, setSelectedDate] = useState(today);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [present, setPresent] = useState({ balvatika: 0, primary: 0, middle: 0 });
    const [consumption, setConsumption] = useState({ rice: 0, dalVeg: 0, oilCond: 0, salt: 0, fuel: 0, total: 0 });
    
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
    const [isOverwriteModalOpen, setOverwriteModalOpen] = useState(false);
    const [isReasonModalOpen, setReasonModalOpen] = useState(false);
    
    const [mainReason, setMainReason] = useState<MainReason | ''>('');
    const [subReason, setSubReason] = useState('');
    const [pendingEntry, setPendingEntry] = useState<DailyEntry | null>(null);

    const isSunday = useMemo(() => new Date(selectedDate + 'T00:00:00').getDay() === 0, [selectedDate]);
    const entryExists = useMemo(() => data.entries.some(e => e.id === selectedDate), [data.entries, selectedDate]);

    // Handle deep-linking from notifications
    useEffect(() => {
        const dateToOpen = sessionStorage.getItem('openEntryForDate');
        if (dateToOpen) {
            sessionStorage.removeItem('openEntryForDate');
            setSelectedDate(dateToOpen);
            // Timeout ensures state update propagates before modal opens
            setTimeout(() => setEntryModalOpen(true), 100);
        }
    }, []);
    
    const calculateConsumption = useCallback(() => {
        const balvatikaRice = (present.balvatika * rates.rice.balvatika) / 1000;
        const primaryRice = (present.primary * rates.rice.primary) / 1000;
        const middleRice = (present.middle * rates.rice.middle) / 1000;
        const totalRice = balvatikaRice + primaryRice + middleRice;

        const dalVeg = (present.balvatika * rates.dalVeg.balvatika) + (present.primary * rates.dalVeg.primary) + (present.middle * rates.dalVeg.middle);
        const oilCond = (present.balvatika * rates.oilCond.balvatika) + (present.primary * rates.oilCond.primary) + (present.middle * rates.oilCond.middle);
        const salt = (present.balvatika * rates.salt.balvatika) + (present.primary * rates.salt.primary) + (present.middle * rates.salt.middle);
        const fuel = (present.balvatika * rates.fuel.balvatika) + (present.primary * rates.fuel.primary) + (present.middle * rates.fuel.middle);

        const totalExpenditure = dalVeg + oilCond + salt + fuel;

        setConsumption({
            rice: parseFloat(totalRice.toFixed(3)),
            dalVeg: parseFloat(dalVeg.toFixed(2)),
            oilCond: parseFloat(oilCond.toFixed(2)),
            salt: parseFloat(salt.toFixed(2)),
            fuel: parseFloat(fuel.toFixed(2)),
            total: parseFloat(totalExpenditure.toFixed(2)),
        });
    }, [present, rates]);

    useEffect(() => {
        calculateConsumption();
    }, [present, calculateConsumption]);

    useEffect(() => {
        const entryForDate = data.entries.find(e => e.id === selectedDate);
        if (entryForDate) {
            setPresent(entryForDate.present);
        } else {
            setPresent({ balvatika: 0, primary: 0, middle: 0 });
        }
    }, [selectedDate, data.entries]);

    const handlePresentChange = (category: keyof typeof present, value: number) => {
        setPresent(prev => ({ ...prev, [category]: value }));
    };

    const initiateSaveProcess = (entry: DailyEntry, overwrite = false) => {
        const success = addEntry(entry, overwrite);
        if (success) {
            showToast(`Entry for ${entry.date} ${overwrite || entryExists ? 'updated' : 'saved'} successfully!`, 'success');
            setEntryModalOpen(false);
        } else if (settings.autoOverwrite) {
            addEntry(entry, true);
            showToast(`Entry for ${entry.date} updated successfully!`, 'success');
            setEntryModalOpen(false);
        } else {
            setPendingEntry(entry);
            setOverwriteModalOpen(true);
        }
    };

    const handleSave = () => {
        if (!selectedDate) {
            showToast('Please select a date.', 'error');
            return;
        }
        const totalPresent = present.balvatika + present.primary + present.middle;

        if (totalPresent > 0) {
            const newEntry: DailyEntry = {
                id: selectedDate,
                date: selectedDate,
                present,
                totalPresent,
                consumption,
            };
            initiateSaveProcess(newEntry);
        } else {
            const existingEntry = data.entries.find(e => e.id === selectedDate);
            const [currentMain = '', currentSub = ''] = existingEntry?.reasonForNoMeal?.split(': ') || [];
            
            const validMainReason = MAIN_REASONS.find(r => r === currentMain);
            if (validMainReason) {
                setMainReason(validMainReason);
                setSubReason(currentSub);
            } else {
                setMainReason('');
                setSubReason('');
            }
            setReasonModalOpen(true);
        }
    };
    
    const handleSaveZeroEntry = () => {
        if (!mainReason) {
            showToast('Please select a main reason.', 'error');
            return;
        }
        const subReasons = NO_MEAL_REASONS_STRUCTURED[mainReason];
        if (subReasons.length > 0 && !subReason) {
            showToast('Please select a sub-reason.', 'error');
            return;
        }

        const finalReason = subReasons.length > 0 ? `${mainReason}: ${subReason}` : mainReason;
        
        const zeroEntry: DailyEntry = {
            id: selectedDate,
            date: selectedDate,
            present: { balvatika: 0, primary: 0, middle: 0 },
            totalPresent: 0,
            consumption: { rice: 0, dalVeg: 0, oilCond: 0, salt: 0, fuel: 0, total: 0 },
            reasonForNoMeal: finalReason,
        };
        setReasonModalOpen(false);
        initiateSaveProcess(zeroEntry);
    };

    const handleMarkAsSunday = () => {
        const sundayEntry: DailyEntry = {
            id: today,
            date: today,
            present: { balvatika: 0, primary: 0, middle: 0 },
            totalPresent: 0,
            consumption: { rice: 0, dalVeg: 0, oilCond: 0, salt: 0, fuel: 0, total: 0 },
            reasonForNoMeal: 'Sunday',
        };
        // Overwrite to make it a one-click action
        initiateSaveProcess(sundayEntry, true);
    };

    const confirmOverwrite = () => {
        if (pendingEntry) {
            initiateSaveProcess(pendingEntry, true);
        }
        setOverwriteModalOpen(false);
        setPendingEntry(null);
    }

    const currentSubReasons = mainReason ? NO_MEAL_REASONS_STRUCTURED[mainReason] : [];

    return (
        <>
             <Modal isOpen={isEntryModalOpen} onClose={() => setEntryModalOpen(false)} title={`Entry for ${new Date(selectedDate+'T00:00:00').toLocaleDateString('en-IN')}`} zIndex="z-40">
                <div className="space-y-4">
                     <fieldset className="border border-slate-300/50 dark:border-slate-600 rounded-lg p-3">
                        <legend className="text-sm font-medium text-sky-700 dark:text-sky-400 px-1">Students Present</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <NumberInput label={`Balvatika (${onRoll.balvatika})`} id="balvatika" value={present.balvatika} onChange={val => handlePresentChange('balvatika', val)} min={0} max={onRoll.balvatika} />
                            <NumberInput label={`Primary (${onRoll.primary})`} id="primary" value={present.primary} onChange={val => handlePresentChange('primary', val)} min={0} max={onRoll.primary} />
                            <NumberInput label={`Middle (${onRoll.middle})`} id="middle" value={present.middle} onChange={val => handlePresentChange('middle', val)} min={0} max={onRoll.middle} />
                        </div>
                    </fieldset>

                     <fieldset className="border border-slate-300/50 dark:border-slate-600 rounded-lg p-3">
                        <legend className="text-sm font-medium text-sky-700 dark:text-sky-400 px-1">Auto-calculated Consumption</legend>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            {Object.entries(consumption).map(([key, value]) => (
                                <div key={key} className="bg-slate-100/40 dark:bg-slate-800/50 p-2 rounded-md">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{key === 'dalVeg' ? 'Dal & Veg' : key === 'oilCond' ? 'Oil & Cond.' : key}</p>
                                    <p className="font-semibold text-slate-800 dark:text-white">{key === 'rice' ? `${value} kg` : `₹${value}`}</p>
                                </div>
                            ))}
                        </div>
                    </fieldset>
                    
                    <Button onClick={handleSave} className="w-full">
                        {entryExists ? 'Update Entry' : 'Save Entry'}
                    </Button>
                </div>
            </Modal>
            <Modal isOpen={isOverwriteModalOpen} onClose={() => setOverwriteModalOpen(false)} title="Confirm Overwrite" zIndex="z-50">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">An entry for this date already exists. Do you want to overwrite it?</p>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setOverwriteModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmOverwrite}>Overwrite</Button>
                </div>
            </Modal>
             <Modal isOpen={isReasonModalOpen} onClose={() => setReasonModalOpen(false)} title="Reason for No Meal" zIndex="z-50">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Please provide a reason for not serving the meal today.</p>
                    <div>
                        <label htmlFor="main-reason-select" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Main Reason</label>
                        <select
                            id="main-reason-select"
                            value={mainReason}
                            onChange={(e) => {
                                setMainReason(e.target.value as MainReason);
                                setSubReason(''); // Reset sub-reason when main reason changes
                            }}
                            className="w-full bg-slate-100/60 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                        >
                            <option value="">Select a reason...</option>
                            {MAIN_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                        </select>
                    </div>

                    {currentSubReasons.length > 0 && (
                        <div>
                            <label htmlFor="sub-reason-select" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Sub-Reason</label>
                            <select
                                id="sub-reason-select"
                                value={subReason}
                                onChange={(e) => setSubReason(e.target.value)}
                                className="w-full bg-slate-100/60 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-2.5"
                            >
                                <option value="">Select a sub-reason...</option>
                                {currentSubReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setReasonModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveZeroEntry}>Save Entry</Button>
                    </div>
                </div>
            </Modal>
            <Card title="Daily Meal Entry" className="relative overflow-hidden">
                <div aria-hidden="true" className="absolute -bottom-4 -right-4 text-sky-500/10 dark:text-sky-500/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12.2c0-3.3 2.9-6.2 6.5-6.2h7c3.6 0 6.5 2.9 6.5 6.2c0 1.9-1.2 3.6-2.7 4.5l-1.5 1c-1.1.7-2.3 1.3-3.3 1.3H9.5c-1 0-2.2-.6-3.3-1.3l-1.5-1C3.2 15.8 2 14.1 2 12.2Z"/>
                        <path d="M6 6s.5 2.2 2.2 2.2"/>
                        <path d="M15.8 6s.5 2.2 2.2 2.2"/>
                        <path d="M10.9 6s.5 2.2 2.2 2.2"/>
                    </svg>
                </div>
                 <div className="relative">
                    {showDatePicker ? (
                        <div className="space-y-3">
                            <Input label="Select Date" id="entry-date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today} />
                            {isSunday && (
                                <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-300 text-xs">
                                    Entries are disabled for Sundays.
                                </div>
                            )}
                            <div className="flex space-x-2">
                                <Button onClick={() => setEntryModalOpen(true)} className="w-full" disabled={isSunday}>
                                    Load & Edit Entry
                                </Button>
                                <Button variant="secondary" onClick={() => { setShowDatePicker(false); setSelectedDate(today); }} className="w-full">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                                </div>
                                <div className="text-right">
                                    {isSunday && selectedDate === today ? (
                                        <Button onClick={handleMarkAsSunday} variant="secondary">
                                            Mark as Sunday
                                        </Button>
                                    ) : (
                                        <Button onClick={() => { setSelectedDate(today); setEntryModalOpen(true); }} disabled={isSunday}>
                                            Add / Edit
                                        </Button>
                                    )}
                                    <button onClick={() => setShowDatePicker(true)} className="block w-full text-center text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 text-xs pt-1">
                                        Edit another...
                                    </button>
                                </div>
                            </div>
                            {isSunday && selectedDate === today && (
                                <div className={`text-center mt-3 p-2 rounded-lg text-xs ${entryExists ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-500/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-300'}`}>
                                    {entryExists ? 'Today has been marked as a non-meal day.' : 'Entries are disabled for today (Sunday).'}
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            </Card>
        </>
    );
};

export default DailyEntryPage;
