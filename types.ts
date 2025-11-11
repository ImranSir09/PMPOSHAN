
export type Page = 'dashboard' | 'summary' | 'receipts' | 'settings' | 'reports';

export interface Notification {
  id: string; // e.g., 'low-stock', 'backup-reminder'
  type: 'warning' | 'info' | 'setup';
  title: string;
  message: string;
  page: Page;
  actionLabel: string;
  actionPayload?: any;
}

export interface AbstractData {
    opening: number;
    received: number;
    total: number;
    consumed?: number;
    expenditure?: number;
    balance: number;
    [key: string]: number | undefined;
}

export interface Rates {
    rice: { balvatika: number; primary: number; middle: number };
    dalVeg: { balvatika: number; primary: number; middle: number };
    oilCond: { balvatika: number; primary: number; middle: number };
    salt: { balvatika: number; primary: number; middle: number };
    fuel: { balvatika: number; primary: number; middle: number };
}

export interface ClassRoll {
    id: string; // e.g., 'c1', 'c2'
    name: string; // e.g., '1st', '2nd'
    general: {
      boys: number;
      girls: number;
    };
    stsc: {
      boys: number;
      girls: number;
    };
}

export interface SchoolDetails {
    name: string;
    udise: string;
    type: string;
    category: string;
    kitchenType: string;
    state: string;
    district: string;
    block: string;
    village: string;
    // New fields for MDCF report
    schoolTypeMDCF: 'Government' | 'Local Body' | 'EGS/AIE Centers' | 'NCLP' | 'Madras / Maqtab' | '';
    schoolCategoryMDCF: 'Primary' | 'Upper Primary' | 'Primary with Upper Primary' | '';
}

export interface CookCumHelper {
    id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Other';
    category: 'GEN' | 'OBC' | 'SC' | 'ST';
    paymentMode: 'Bank' | 'Cash' | 'Cheque';
    amountPaid: number;
}

export interface HealthStatus {
    ifaBoys: number;
    ifaGirls: number;
    screenedByRBSK: number;
    referredByRBSK: number;
}

export type InspectionAuthority = 'Task Force' | 'District Officials' | 'Block Officials' | 'SMC Members' | '';

export interface InspectionReport {
    inspected: boolean;
    incidentsCount: number;
    inspectedBy: InspectionAuthority;
}

export interface MDMIncharge {
    name: string;
    contact: string;
}

export interface NotificationSettings {
    enabled: boolean;
    lowRiceThreshold: number;
    lowCashThreshold: number;
    backupReminderFrequency: number; // in days
}

export interface Settings {
    schoolDetails: SchoolDetails;
    classRolls: ClassRoll[];
    rates: Rates;
    autoOverwrite: boolean;
    cooks: CookCumHelper[];
    healthStatus: HealthStatus;
    inspectionReport: InspectionReport;
    initialOpeningBalance: MonthlyBalanceData;
    mdmIncharge: MDMIncharge;
    headOfInstitution: MDMIncharge;
    notificationSettings: NotificationSettings;
    mmeExpenditure: number; // New field for MDCF report
}

export interface DailyEntry {
    id: string; // YYYY-MM-DD
    date: string;
    present: {
        balvatika: number;
        primary: number;
        middle: number;
    };
    totalPresent: number;
    consumption: {
        rice: number;
        dalVeg: number;
        oilCond: number;
        salt: number;
        fuel: number;
        total: number;
    };
    reasonForNoMeal?: string;
}

export type Category = 'balvatika' | 'primary' | 'middle';

export interface CategoryBalance {
    balvatika: number;
    primary: number;
    middle: number;
}

export interface MonthlyBalanceData {
    rice: CategoryBalance;
    cash: CategoryBalance;
}

export interface Receipt {
    id: string; // ISO string
    date: string; // YYYY-MM-DD
    rice: CategoryBalance;
    cash: CategoryBalance;
}

export interface MonthlyBalance {
    [key: string]: MonthlyBalanceData; // key is YYYY-MM
}

export interface AuthData {
    username: string;
    password?: string;
    securityQuestion: string;
    securityAnswer: string;
    contact?: string;
}

export interface AppData {
    auth?: AuthData;
    settings: Settings;
    entries: DailyEntry[];
    receipts: Receipt[];
    monthlyBalances: MonthlyBalance;
    lastBackupDate?: string; // ISO string
    welcomeScreenShown?: boolean;
}