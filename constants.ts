
import { Settings, ClassRoll } from './types';

export const CLASS_STRUCTURE: { id: string, name: string }[] = [
    { id: 'c8', name: '8th' },
    { id: 'c7', name: '7th' },
    { id: 'c6', name: '6th' },
    { id: 'c5', name: '5th' },
    { id: 'c4', name: '4th' },
    { id: 'c3', name: '3rd' },
    { id: 'c2', name: '2nd' },
    { id: 'c1', name: '1st' },
    { id: 'bal', name: 'Balvatika' },
    { id: 'pp1', name: 'PP1' },
    { id: 'pp2', name: 'PP2' },
];

export const SIGNUP_KEY = 'PM-POSHAN-2024';

export const DEFAULT_SETTINGS: Settings = {
    schoolDetails: {
        name: "Government Primary School",
        udise: "01234567890",
        type: "Co-Educational",
        category: "Primary with Upper Primary",
        kitchenType: "School Kitchen",
        state: "State",
        district: "District",
        block: "Block",
        village: "Village/Ward",
        schoolTypeMDCF: '',
        schoolCategoryMDCF: 'Primary with Upper Primary',
    },
    classRolls: CLASS_STRUCTURE.map(c => ({
        ...c,
        general: { boys: 0, girls: 0 },
        stsc: { boys: 0, girls: 0 },
    })),
    rates: {
        rice: { balvatika: 100, primary: 100, middle: 150 }, // in grams
        dalVeg: { balvatika: 3.50, primary: 3.50, middle: 5.40 },
        oilCond: { balvatika: 1.10, primary: 1.10, middle: 2.00 },
        salt: { balvatika: 0.80, primary: 0.80, middle: 1.00 },
        fuel: { balvatika: 1.38, primary: 1.38, middle: 1.77 },
    },
    autoOverwrite: false,
    cooks: [],
    healthStatus: {
        ifaBoys: 0,
        ifaGirls: 0,
        screenedByRBSK: 0,
        referredByRBSK: 0,
    },
    inspectionReport: {
        inspected: false,
        incidentsCount: 0,
        inspectedBy: '',
    },
    initialOpeningBalance: {
        rice: { balvatika: 0, primary: 0, middle: 0 },
        cash: { balvatika: 0, primary: 0, middle: 0 },
    },
    mdmIncharge: {
        name: '',
        contact: '',
    },
    headOfInstitution: {
        name: '',
        contact: '',
    },
    notificationSettings: {
        enabled: true,
        lowRiceThreshold: 10, // in kg
        lowCashThreshold: 500, // in rupees
        backupReminderFrequency: 30, // in days
    },
    mmeExpenditure: 0,
};
