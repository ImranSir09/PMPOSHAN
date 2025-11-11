import React, { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Accordion, AccordionItem } from '../ui/Accordion';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useData } from '../../hooks/useData';
import { Settings, SchoolDetails, Rates, Category, CookCumHelper, ClassRoll, MonthlyBalanceData, MDMIncharge, NotificationSettings, InspectionReport, InspectionAuthority } from '../../types';
import { useToast } from '../../hooks/useToast';
import { CLASS_STRUCTURE } from '../../constants';
import { indianStates, jkDistrictsWithZones } from '../../data/locations';
import { validateSettings } from '../../services/validator';
import NumberInput from '../ui/NumberInput';
import DataManagement from '../ui/DataManagement';


const calculateSectionTotals = (classes: ClassRoll[]) => {
    return classes.reduce((acc, cr) => {
        acc.general.boys += cr.general.boys;
        acc.general.girls += cr.general.girls;
        acc.stsc.boys += cr.stsc.boys;
        acc.stsc.girls += cr.stsc.girls;
        acc.total.boys += cr.general.boys + cr.stsc.boys;
        acc.total.girls += cr.general.girls + cr.stsc.girls;
        acc.total.onRoll += cr.general.boys + cr.general.girls + cr.stsc.boys + cr.stsc.girls;
        return acc;
    }, {
        general: { boys: 0, girls: 0 },
        stsc: { boys: 0, girls: 0 },
        total: { boys: 0, girls: 0, onRoll: 0 },
    });
};

const SectionTotalRow: React.FC<{ label: string, totals: ReturnType<typeof calculateSectionTotals> }> = ({ label, totals }) => (
    <tr className="font-bold bg-amber-200/40 dark:bg-gray-800/70">
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{label}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{totals.general.boys}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{totals.general.girls}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{totals.stsc.boys}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{totals.stsc.girls}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{totals.total.boys}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600">{totals.total.girls}</td>
        <td className="p-2 border border-amber-300/50 dark:border-gray-600 text-amber-700 dark:text-amber-400">{totals.total.onRoll}</td>
    </tr>
);

const SettingsPage: React.FC = () => {
    const { data, updateSettings } = useData();
    const [settings, setSettings] = useState<Settings>(data.settings);
    const { showToast } = useToast();
    const [isUdiseValid, setIsUdiseValid] = useState(settings.schoolDetails.udise.length === 11 || settings.schoolDetails.udise.length === 0);
    const [isRatesEditable, setIsRatesEditable] = useState(false);

    const availableDistricts = useMemo(() => {
        const selectedStateData = indianStates.find(s => s.name === settings.schoolDetails.state);
        return selectedStateData ? selectedStateData.districts.sort() : [];
    }, [settings.schoolDetails.state]);

    const availableZones = useMemo(() => {
        if (settings.schoolDetails.state !== 'Jammu and Kashmir') {
            return [];
        }
        const selectedDistrictData = jkDistrictsWithZones.find(d => d.name === settings.schoolDetails.district);
        return selectedDistrictData ? selectedDistrictData.zones.sort() : [];
    }, [settings.schoolDetails.state, settings.schoolDetails.district]);

    const handleSchoolDetailsChange = (field: keyof SchoolDetails, value: string) => {
        if (field === 'udise') {
            setIsUdiseValid(value.length === 11 || value.length === 0);
        }
        
        const newSchoolDetails = { ...settings.schoolDetails, [field]: value };
        
        if (field === 'schoolCategoryMDCF') {
            newSchoolDetails.category = value;
        }

        if (field === 'state') {
            newSchoolDetails.district = '';
            newSchoolDetails.block = ''; // Reset block when state changes
        }
         if (field === 'district') {
            newSchoolDetails.block = ''; // Reset block when district changes
        }

        setSettings(prev => ({ ...prev, schoolDetails: newSchoolDetails }));
    }

    const handleInchargeChange = (field: keyof MDMIncharge, value: string) => {
        setSettings(prev => ({
            ...prev,
            mdmIncharge: {
                ...(prev.mdmIncharge || { name: '', contact: '' }),
                [field]: value
            }
        }));
    };

    const handleHeadChange = (field: keyof MDMIncharge, value: string) => {
        setSettings(prev => ({
            ...prev,
            headOfInstitution: {
                ...(prev.headOfInstitution || { name: '', contact: '' }),
                [field]: value
            }
        }));
    };
    
    const handleClassRollChange = (classId: string, category: 'general' | 'stsc', gender: 'boys' | 'girls', value: string) => {
        const numValue = parseInt(value) || 0;
        setSettings(prev => ({
            ...prev,
            classRolls: prev.classRolls.map(cr => 
                cr.id === classId 
                ? { ...cr, [category]: { ...cr[category], [gender]: numValue } }
                : cr
            )
        }));
    };

    const handleRateChange = (rateType: keyof Rates, category: Category, value: number) => {
        setSettings(prev => ({ ...prev, rates: { ...prev.rates, [rateType]: { ...prev.rates[rateType], [category]: value || 0 }}}));
    };
    
     const handleOpeningBalanceChange = (
        type: keyof MonthlyBalanceData,
        category: Category,
        value: string
    ) => {
        const numValue = parseFloat(value) || 0;
        setSettings(prev => ({
            ...prev,
            initialOpeningBalance: {
                ...(prev.initialOpeningBalance || { 
                    rice: { balvatika: 0, primary: 0, middle: 0 }, 
                    cash: { balvatika: 0, primary: 0, middle: 0 } 
                }),
                [type]: {
                    ...(prev.initialOpeningBalance?.[type] || { balvatika: 0, primary: 0, middle: 0 }),
                    [category]: numValue,
                },
            },
        }));
    };
    
    const handleNotificationChange = (field: keyof NotificationSettings, value: string | boolean) => {
        const finalValue = typeof value === 'boolean' ? value : parseInt(value, 10) || 0;
        setSettings(prev => ({
            ...prev,
            notificationSettings: {
                ...(prev.notificationSettings || { enabled: true, lowRiceThreshold: 10, lowCashThreshold: 500, backupReminderFrequency: 30 }),
                [field]: finalValue,
            },
        }));
    };

    const handleCookChange = (id: string, field: keyof CookCumHelper, value: string | number) => {
        setSettings(prev => ({
            ...prev,
            cooks: prev.cooks.map(cook => cook.id === id ? { ...cook, [field]: value } : cook)
        }));
    };

    const addCook = () => {
        const newCook: CookCumHelper = { id: nanoid(), name: '', gender: 'Female', category: 'GEN', paymentMode: 'Bank', amountPaid: 0 };
        setSettings(prev => ({...prev, cooks: [...prev.cooks, newCook]}));
    };

    const removeCook = (id: string) => {
        setSettings(prev => ({ ...prev, cooks: prev.cooks.filter(cook => cook.id !== id) }));
    };

    const handleHealthChange = (field: keyof Settings['healthStatus'], value: string) => {
        setSettings(prev => ({ ...prev, healthStatus: { ...prev.healthStatus, [field]: parseInt(value) || 0 }}));
    }

    const handleInspectionChange = (field: keyof InspectionReport, value: string | boolean) => {
        let finalValue: string | boolean | number = value;
        if (field === 'incidentsCount') {
            finalValue = parseInt(value as string, 10) || 0;
        } else {
            finalValue = value;
        }
        setSettings(prev => ({ ...prev, inspectionReport: { ...prev.inspectionReport, [field]: finalValue } }));
    };
    
    const handleSave = () => {
        const validationErrors = validateSettings(settings);
        
        const isUdiseCorrectLength = settings.schoolDetails.udise.length === 11 || settings.schoolDetails.udise.length === 0;
        setIsUdiseValid(isUdiseCorrectLength);
        if (!isUdiseCorrectLength) {
            validationErrors.push('UDISE code must be 11 digits long.');
        }

        if (validationErrors.length > 0) {
            validationErrors.forEach(error => showToast(error, 'error'));
            return;
        }

        updateSettings(settings);
        showToast('Settings saved successfully!', 'success');
    };

    const { middleClasses, primaryClasses, prePrimaryClasses, grandTotal } = useMemo(() => {
        const classOrder = CLASS_STRUCTURE.reduce((acc, c, index) => {
            acc[c.id] = index;
            return acc;
        }, {} as Record<string, number>);

        const sortFunction = (a: ClassRoll, b: ClassRoll) => (classOrder[a.id] ?? 99) - (classOrder[b.id] ?? 99);
        
        const allRolls = settings.classRolls || [];
        
        const middle = allRolls.filter(c => ['c6', 'c7', 'c8'].includes(c.id)).sort(sortFunction);
        const primary = allRolls.filter(c => ['c1', 'c2', 'c3', 'c4', 'c5'].includes(c.id)).sort(sortFunction);
        const prePrimary = allRolls.filter(c => ['bal', 'pp1', 'pp2'].includes(c.id)).sort(sortFunction);

        const total = calculateSectionTotals(allRolls);
        return { middleClasses: middle, primaryClasses: primary, prePrimaryClasses: prePrimary, grandTotal: total };
    }, [settings.classRolls]);

    const middleTotals = useMemo(() => calculateSectionTotals(middleClasses), [middleClasses]);
    const primaryTotals = useMemo(() => calculateSectionTotals(primaryClasses), [primaryClasses]);
    const prePrimaryTotals = useMemo(() => calculateSectionTotals(prePrimaryClasses), [prePrimaryClasses]);

    const foodRateTotals = useMemo(() => {
        const { rates } = settings;
        const dalVeg = rates.dalVeg || { balvatika: 0, primary: 0, middle: 0 };
        const oilCond = rates.oilCond || { balvatika: 0, primary: 0, middle: 0 };
        const salt = rates.salt || { balvatika: 0, primary: 0, middle: 0 };
        const fuel = rates.fuel || { balvatika: 0, primary: 0, middle: 0 };
        
        const balvatika = dalVeg.balvatika + oilCond.balvatika + salt.balvatika + fuel.balvatika;
        const primary = dalVeg.primary + oilCond.primary + salt.primary + fuel.primary;
        const middle = dalVeg.middle + oilCond.middle + salt.middle + fuel.middle;
        
        return {
            balvatika: parseFloat(balvatika.toPrecision(15)),
            primary: parseFloat(primary.toPrecision(15)),
            middle: parseFloat(middle.toPrecision(15)),
        };
    }, [settings.rates]);

    return (
        <div className="pb-32">
            <div className="space-y-4">
                <Accordion defaultOpenId="general">
                    <AccordionItem id="general" title="General & School Details">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-2">School Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input containerClassName="md:col-span-2" label="School Name" id="schoolName" value={settings.schoolDetails.name} onChange={e => handleSchoolDetailsChange('name', e.target.value)} required />
                                    <div className="md:col-span-2">
                                        <Input 
                                            label="UDISE Code (11 digits)" 
                                            id="udise" 
                                            type="number" 
                                            value={settings.schoolDetails.udise} 
                                            onChange={e => handleSchoolDetailsChange('udise', e.target.value)}
                                            onInput={(e) => { if (e.currentTarget.value.length > 11) e.currentTarget.value = e.currentTarget.value.slice(0, 11); }}
                                            className={!isUdiseValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                        />
                                        {!isUdiseValid ? (
                                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">UDISE code must be 11 digits long.</p>
                                        ) : (
                                            <p className="mt-1 text-xs text-stone-500 dark:text-gray-400">Unified District Information System for Education code.</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="schoolTypeMDCF" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">School Type</label>
                                        <select id="schoolTypeMDCF" value={settings.schoolDetails.schoolTypeMDCF} onChange={e => handleSchoolDetailsChange('schoolTypeMDCF', e.target.value)} className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5" required>
                                            <option value="">Select Type</option>
                                            <option value="Government">Government</option>
                                            <option value="Local Body">Local Body</option>
                                            <option value="EGS/AIE Centers">EGS/AIE Centers</option>
                                            <option value="NCLP">NCLP</option>
                                            <option value="Madras / Maqtab">Madras / Maqtab</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="schoolCategoryMDCF" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">School Category</label>
                                        <select id="schoolCategoryMDCF" value={settings.schoolDetails.schoolCategoryMDCF} onChange={e => handleSchoolDetailsChange('schoolCategoryMDCF', e.target.value)} className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5" required>
                                            <option value="Primary">Primary</option>
                                            <option value="Upper Primary">Upper Primary</option>
                                            <option value="Primary with Upper Primary">Primary with Upper Primary</option>
                                        </select>
                                    </div>

                                    <Input label="Kitchen Type" id="kitchenType" value={settings.schoolDetails.kitchenType} onChange={e => handleSchoolDetailsChange('kitchenType', e.target.value)} />
                                    <div>
                                        <label htmlFor="state" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">State</label>
                                        <select
                                            id="state"
                                            value={settings.schoolDetails.state}
                                            onChange={e => handleSchoolDetailsChange('state', e.target.value)}
                                            className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5"
                                            required
                                        >
                                            <option value="">Select State</option>
                                            {indianStates.map(state => (
                                                <option key={state.name} value={state.name}>{state.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="district" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">District</label>
                                        <select
                                            id="district"
                                            value={settings.schoolDetails.district}
                                            onChange={e => handleSchoolDetailsChange('district', e.target.value)}
                                            disabled={!settings.schoolDetails.state || availableDistricts.length === 0}
                                            className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            required
                                        >
                                            <option value="">Select District</option>
                                            {availableDistricts.map(district => (
                                                <option key={district} value={district}>{district}</option>
                                            ))}
                                        </select>
                                    </div>
                                     {settings.schoolDetails.state === 'Jammu and Kashmir' ? (
                                        <div>
                                            <label htmlFor="block" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Block/Educational Zone</label>
                                            <select
                                                id="block"
                                                value={settings.schoolDetails.block}
                                                onChange={e => handleSchoolDetailsChange('block', e.target.value)}
                                                disabled={!settings.schoolDetails.district || availableZones.length === 0}
                                                className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-900 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                required
                                            >
                                                <option value="">Select Zone</option>
                                                {availableZones.map(zone => (
                                                    <option key={zone} value={zone}>{zone}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <Input label="Block" id="block" value={settings.schoolDetails.block} onChange={e => handleSchoolDetailsChange('block', e.target.value)} required />
                                    )}
                                    <Input label="Village/Ward" id="village" value={settings.schoolDetails.village} onChange={e => handleSchoolDetailsChange('village', e.target.value)} required />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-1">MDM Incharge (App User)</h3>
                                <p className="text-xs text-stone-500 dark:text-gray-400 mb-2">Details of the person primarily using this application. This name appears on reports.</p>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <Input 
                                        label="Incharge's Name" 
                                        id="incharge-name" 
                                        value={settings.mdmIncharge?.name || ''} 
                                        onChange={e => handleInchargeChange('name', e.target.value)} 
                                        required
                                    />
                                    <Input 
                                        label="Contact Number" 
                                        id="incharge-contact" 
                                        type="tel" 
                                        maxLength={10}
                                        value={settings.mdmIncharge?.contact || ''} 
                                        onChange={e => handleInchargeChange('contact', e.target.value)}
                                        onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-1">Head of the Institution</h3>
                                <p className="text-xs text-stone-500 dark:text-gray-400 mb-2">Official's name for signature blocks on all generated reports.</p>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <Input 
                                        label="Head's Name" 
                                        id="head-name" 
                                        value={settings.headOfInstitution?.name || ''} 
                                        onChange={e => handleHeadChange('name', e.target.value)} 
                                        required
                                    />
                                    <Input 
                                        label="Contact Number" 
                                        id="head-contact" 
                                        type="tel" 
                                        maxLength={10}
                                        value={settings.headOfInstitution?.contact || ''} 
                                        onChange={e => handleHeadChange('contact', e.target.value)}
                                        onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-2">Preferences</h3>
                                <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-gray-800/50 rounded-lg">
                                    <div>
                                        <label htmlFor="auto-overwrite" className="font-medium text-stone-700 dark:text-gray-300">Auto-overwrite entry</label>
                                        <p className="text-xs text-stone-500 dark:text-gray-400">Automatically overwrite daily entries without asking.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="auto-overwrite" className="sr-only peer" checked={settings.autoOverwrite} onChange={e => setSettings(p => ({...p, autoOverwrite: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-stone-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </AccordionItem>
                    
                    <AccordionItem id="notifications" title="Notifications">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-gray-800/50 rounded-lg">
                                <div>
                                    <label htmlFor="notifications-enabled" className="font-medium text-stone-700 dark:text-gray-300">Enable Notifications</label>
                                    <p className="text-xs text-stone-500 dark:text-gray-400">Show alerts for low stock and backup reminders.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="notifications-enabled" className="sr-only peer" checked={settings.notificationSettings?.enabled} onChange={e => handleNotificationChange('enabled', e.target.checked)} />
                                    <div className="w-11 h-6 bg-stone-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>
                            {settings.notificationSettings?.enabled && (
                                <div className="space-y-3">
                                    <Input 
                                        label="Low Rice Threshold (kg)" 
                                        id="low-rice" type="number" 
                                        min="0"
                                        value={settings.notificationSettings.lowRiceThreshold} 
                                        onChange={e => handleNotificationChange('lowRiceThreshold', e.target.value)} 
                                    />
                                    <Input 
                                        label="Low Cash Threshold (₹)" 
                                        id="low-cash" 
                                        type="number" 
                                        min="0"
                                        value={settings.notificationSettings.lowCashThreshold} 
                                        onChange={e => handleNotificationChange('lowCashThreshold', e.target.value)} 
                                    />
                                    <Input 
                                        label="Backup Reminder Frequency (days)" 
                                        id="backup-freq" 
                                        type="number" 
                                        min="0"
                                        value={settings.notificationSettings.backupReminderFrequency} 
                                        onChange={e => handleNotificationChange('backupReminderFrequency', e.target.value)} 
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionItem>

                    <AccordionItem id="enrollment" title="Student Enrollment (Roll Statement)">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-center border-collapse">
                                <thead className="bg-amber-100/60 dark:bg-gray-800/50">
                                    <tr>
                                        <th rowSpan={2} className="p-2 border border-amber-300/50 dark:border-gray-600">Class</th>
                                        <th colSpan={2} className="p-2 border border-amber-300/50 dark:border-gray-600">General</th>
                                        <th colSpan={2} className="p-2 border border-amber-300/50 dark:border-gray-600">ST/SC</th>
                                        <th colSpan={2} className="p-2 border border-amber-300/50 dark:border-gray-600">Total</th>
                                        <th rowSpan={2} className="p-2 border border-amber-300/50 dark:border-gray-600">On Roll</th>
                                    </tr>
                                    <tr>
                                        <th className="p-2 border border-amber-300/50 dark:border-gray-600">Boys</th>
                                        <th className="p-2 border border-amber-300/50 dark:border-gray-600">Girls</th>
                                        <th className="p-2 border border-amber-300/50 dark:border-gray-600">Boys</th>
                                        <th className="p-2 border border-amber-300/50 dark:border-gray-600">Girls</th>
                                        <th className="p-2 border border-amber-300/50 dark:border-gray-600">Boys</th>
                                        <th className="p-2 border border-amber-300/50 dark:border-gray-600">Girls</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { title: 'Middle (VI-VIII)', classes: middleClasses, totals: middleTotals },
                                        { title: 'Primary (I-V)', classes: primaryClasses, totals: primaryTotals },
                                        { title: 'Pre-Primary', classes: prePrimaryClasses, totals: prePrimaryTotals }
                                    ].map(section => section.classes.length > 0 && (
                                        <React.Fragment key={section.title}>
                                            <tr className="bg-amber-100/40 dark:bg-gray-700/50">
                                                <td colSpan={8} className="p-1 font-bold text-amber-800 dark:text-amber-400 text-left pl-2">{section.title}</td>
                                            </tr>
                                            {section.classes.map(cr => {
                                                const totalBoys = cr.general.boys + cr.stsc.boys;
                                                const totalGirls = cr.general.girls + cr.stsc.girls;
                                                const onRoll = totalBoys + totalGirls;
                                                return (
                                                    <tr key={cr.id} className="border-b border-amber-200/50 dark:border-gray-700">
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600 font-semibold">{cr.name}</td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600"><input type="number" min="0" value={cr.general.boys} onChange={e => handleClassRollChange(cr.id, 'general', 'boys', e.target.value)} className="w-12 bg-amber-100/60 dark:bg-gray-700/50 rounded p-1 text-center"/></td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600"><input type="number" min="0" value={cr.general.girls} onChange={e => handleClassRollChange(cr.id, 'general', 'girls', e.target.value)} className="w-12 bg-amber-100/60 dark:bg-gray-700/50 rounded p-1 text-center"/></td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600"><input type="number" min="0" value={cr.stsc.boys} onChange={e => handleClassRollChange(cr.id, 'stsc', 'boys', e.target.value)} className="w-12 bg-amber-100/60 dark:bg-gray-700/50 rounded p-1 text-center"/></td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600"><input type="number" min="0" value={cr.stsc.girls} onChange={e => handleClassRollChange(cr.id, 'stsc', 'girls', e.target.value)} className="w-12 bg-amber-100/60 dark:bg-gray-700/50 rounded p-1 text-center"/></td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600 font-bold">{totalBoys}</td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600 font-bold">{totalGirls}</td>
                                                        <td className="p-1 border border-amber-300/50 dark:border-gray-600 font-bold text-amber-700 dark:text-amber-400">{onRoll}</td>
                                                    </tr>
                                                );
                                            })}
                                            <SectionTotalRow label={`${section.title.split(' ')[0]} Total`} totals={section.totals} />
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot className="font-bold bg-amber-200/50 dark:bg-gray-800">
                                <SectionTotalRow label="Grand Total" totals={grandTotal} />
                                </tfoot>
                            </table>
                        </div>
                    </AccordionItem>
                    
                    <AccordionItem id="finance" title="Financial, Stock & Rates">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-2">Initial Opening Balance</h3>
                                <p className="text-xs text-stone-500 dark:text-gray-400 mb-3">
                                    Set this once during initial setup. It acts as the starting balance for your records. After the first month, balances will roll over automatically.
                                </p>
                                <div className="space-y-3">
                                    <fieldset className="border border-amber-300/50 dark:border-gray-600 rounded-lg p-3">
                                        <legend className="text-sm font-medium text-amber-700 dark:text-amber-400 px-1">Opening Rice Balance (kg)</legend>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input label="Balvatika" id="ob-rice-bal" type="number" step="0.001" value={settings.initialOpeningBalance?.rice?.balvatika || 0} onChange={e => handleOpeningBalanceChange('rice', 'balvatika', e.target.value)} />
                                            <Input label="Primary" id="ob-rice-pri" type="number" step="0.001" value={settings.initialOpeningBalance?.rice?.primary || 0} onChange={e => handleOpeningBalanceChange('rice', 'primary', e.target.value)} />
                                            <Input label="Middle" id="ob-rice-mid" type="number" step="0.001" value={settings.initialOpeningBalance?.rice?.middle || 0} onChange={e => handleOpeningBalanceChange('rice', 'middle', e.target.value)} />
                                        </div>
                                    </fieldset>
                                    <fieldset className="border border-amber-300/50 dark:border-gray-600 rounded-lg p-3">
                                        <legend className="text-sm font-medium text-amber-700 dark:text-amber-400 px-1">Opening Cash Balance (₹)</legend>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input label="Balvatika" id="ob-cash-bal" type="number" step="0.01" value={settings.initialOpeningBalance?.cash?.balvatika || 0} onChange={e => handleOpeningBalanceChange('cash', 'balvatika', e.target.value)} />
                                            <Input label="Primary" id="ob-cash-pri" type="number" step="0.01" value={settings.initialOpeningBalance?.cash?.primary || 0} onChange={e => handleOpeningBalanceChange('cash', 'primary', e.target.value)} />
                                            <Input label="Middle" id="ob-cash-mid" type="number" step="0.01" value={settings.initialOpeningBalance?.cash?.middle || 0} onChange={e => handleOpeningBalanceChange('cash', 'middle', e.target.value)} />
                                        </div>
                                    </fieldset>
                                    <div>
                                        <Input 
                                            label="MME Expenditure for this month (₹)" 
                                            id="mme-expenditure" 
                                            type="number" 
                                            step="0.01"
                                            min="0"
                                            value={settings.mmeExpenditure || 0}
                                            onChange={e => setSettings(prev => ({ ...prev, mmeExpenditure: parseFloat(e.target.value) || 0 }))}
                                        />
                                        <p className="mt-1 text-xs text-stone-500 dark:text-gray-400">Management, Monitoring, and Evaluation expenditure. Required for the MDCF report.</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-2">Food Rate Configuration</h3>
                                <div className="flex items-center justify-between p-3 mb-3 bg-amber-100/50 dark:bg-gray-800/50 rounded-lg">
                                    <div>
                                        <label htmlFor="edit-rates" className="font-medium text-stone-700 dark:text-gray-300">Edit Food Rates</label>
                                        <p className="text-xs text-stone-500 dark:text-gray-400">Enable to adjust per-student rates as per official guidelines.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="edit-rates" className="sr-only peer" checked={isRatesEditable} onChange={e => setIsRatesEditable(e.target.checked)} />
                                        <div className="w-11 h-6 bg-stone-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                    </label>
                                </div>
                                <div className="space-y-3 text-xs">
                                    {(Object.keys(settings.rates) as Array<keyof Rates>).map(rateKey => {
                                        const isRice = rateKey === 'rice';
                                        const currentStep = isRice ? 1 : 0.01;
                                        const currentMax = isRice ? 1000 : 999;
                                        return (
                                        <div key={rateKey}>
                                            <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 capitalize">
                                                {rateKey.replace(/([A-Z])/g, ' $1')}
                                                {isRice && <span className="font-normal text-stone-500"> (in grams)</span>}
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <NumberInput label="Balvatika" id={`${rateKey}-bal`} step={currentStep} value={settings.rates[rateKey].balvatika} onChange={val => handleRateChange(rateKey, 'balvatika', val)} min={0} max={currentMax} disabled={!isRatesEditable} />
                                                <NumberInput label="Primary" id={`${rateKey}-pri`} step={currentStep} value={settings.rates[rateKey].primary} onChange={val => handleRateChange(rateKey, 'primary', val)} min={0} max={currentMax} disabled={!isRatesEditable} />
                                                <NumberInput label="Middle" id={`${rateKey}-mid`} step={currentStep} value={settings.rates[rateKey].middle} onChange={val => handleRateChange(rateKey, 'middle', val)} min={0} max={currentMax} disabled={!isRatesEditable} />
                                            </div>
                                        </div>
                                        )
                                    })}
                                     <div className="pt-3 mt-3 border-t border-amber-300/50 dark:border-gray-600">
                                        <p className="font-bold text-amber-800 dark:text-amber-300 mb-1 capitalize text-sm">
                                            Total Per Student Cost (₹)
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-amber-200/50 dark:bg-gray-800/60 p-2 rounded-md text-center">
                                                <p className="text-xs text-stone-500 dark:text-gray-400">Balvatika</p>
                                                <p className="font-semibold text-stone-800 dark:text-white">₹{foodRateTotals.balvatika.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-amber-200/50 dark:bg-gray-800/60 p-2 rounded-md text-center">
                                                <p className="text-xs text-stone-500 dark:text-gray-400">Primary</p>
                                                <p className="font-semibold text-stone-800 dark:text-white">₹{foodRateTotals.primary.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-amber-200/50 dark:bg-gray-800/60 p-2 rounded-md text-center">
                                                <p className="text-xs text-stone-500 dark:text-gray-400">Middle</p>
                                                <p className="font-semibold text-stone-800 dark:text-white">₹{foodRateTotals.middle.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <p className="mt-1 text-xs text-stone-500 dark:text-gray-400">Auto-calculated sum of Dal/Veg, Oil/Cond, Salt, and Fuel rates.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem id="staff" title="Staff & Health Records">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-1">Cook-Cum-Helper Details</h3>
                                <p className="text-xs text-stone-500 dark:text-gray-400 mb-2">This information is used for the official MDCF report.</p>
                                <div className="space-y-3">
                                    {settings.cooks.map((cook, index) => (
                                        <div key={cook.id} className="p-3 border border-amber-300/50 dark:border-gray-600 rounded-lg space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Cook #{index + 1}</p>
                                                <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => removeCook(cook.id)}>Remove</Button>
                                            </div>
                                            <Input label="Name" id={`cook-name-${cook.id}`} value={cook.name} onChange={e => handleCookChange(cook.id, 'name', e.target.value)} required />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Gender</label>
                                                    <select value={cook.gender} onChange={e => handleCookChange(cook.id, 'gender', e.target.value)} className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500">
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Category</label>
                                                    <select value={cook.category} onChange={e => handleCookChange(cook.id, 'category', e.target.value)} className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500">
                                                        <option value="GEN">GEN</option>
                                                        <option value="OBC">OBC</option>
                                                        <option value="SC">SC</option>
                                                        <option value="ST">ST</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                 <div>
                                                    <label className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Payment Mode</label>
                                                    <select value={cook.paymentMode} onChange={e => handleCookChange(cook.id, 'paymentMode', e.target.value)} className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500">
                                                        <option value="Bank">Bank</option>
                                                        <option value="Cash">Cash</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                </div>
                                                <Input label="Amount Paid (₹)" id={`cook-amount-${cook.id}`} type="number" min="0" value={cook.amountPaid} onChange={e => handleCookChange(cook.id, 'amountPaid', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={addCook} variant="secondary" className="w-full mt-3">Add Cook</Button>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-1">Health Status</h3>
                                <p className="text-xs text-stone-500 dark:text-gray-400 mb-2">Data for the monthly MDCF report.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="IFA Tablets (Boys)" id="ifa-boys" type="number" min="0" value={settings.healthStatus.ifaBoys} onChange={e => handleHealthChange('ifaBoys', e.target.value)} />
                                    <Input label="IFA Tablets (Girls)" id="ifa-girls" type="number" min="0" value={settings.healthStatus.ifaGirls} onChange={e => handleHealthChange('ifaGirls', e.target.value)} />
                                    <Input label="Screened by RBSK Team" id="screened-rbsk" type="number" min="0" value={settings.healthStatus.screenedByRBSK} onChange={e => handleHealthChange('screenedByRBSK', e.target.value)} />
                                    <Input label="Referred by RBSK Team" id="referred-rbsk" type="number" min="0" value={settings.healthStatus.referredByRBSK} onChange={e => handleHealthChange('referredByRBSK', e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-stone-700 dark:text-gray-300 mb-1">Inspection Report</h3>
                                <p className="text-xs text-stone-500 dark:text-gray-400 mb-2">Data for the monthly MDCF report.</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-gray-800/50 rounded-lg">
                                        <div>
                                            <label htmlFor="inspected" className="font-medium text-stone-700 dark:text-gray-300">Was an inspection done this month?</label>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="inspected" className="sr-only peer" checked={settings.inspectionReport.inspected} onChange={e => handleInspectionChange('inspected', e.target.checked)} />
                                            <div className="w-11 h-6 bg-stone-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                        </label>
                                    </div>
                                    {settings.inspectionReport.inspected && (
                                        <div className="p-3 border border-amber-300/50 dark:border-gray-600 rounded-lg">
                                            <label htmlFor="inspected-by" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Inspected by:</label>
                                            <select
                                                id="inspected-by"
                                                value={settings.inspectionReport.inspectedBy}
                                                onChange={e => handleInspectionChange('inspectedBy', e.target.value as InspectionAuthority)}
                                                className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500"
                                            >
                                                <option value="">Select Inspector</option>
                                                <option value="Task Force">Members of Task Force</option>
                                                <option value="District Officials">District Officials</option>
                                                <option value="Block Officials">Block/Taluka Level Officials</option>
                                                <option value="SMC Members">SMC Members</option>
                                            </select>
                                        </div>
                                    )}
                                    <Input label="Number of untoward incidents" id="incidents" type="number" min="0" value={settings.inspectionReport.incidentsCount} onChange={e => handleInspectionChange('incidentsCount', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </AccordionItem>
                    <AccordionItem id="data" title="Data Management & Help">
                        <DataManagement />
                    </AccordionItem>
                </Accordion>
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-amber-200/50 dark:border-white/20">
                <div className="max-w-2xl mx-auto">
                    <Button onClick={handleSave} className="w-full">Save All Settings</Button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;