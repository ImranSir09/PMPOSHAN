import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import { Category, CookCumHelper, InspectionAuthority, InspectionReport, Settings } from '../../types';
import PDFPreviewModal from '../ui/PDFPreviewModal';
import { generatePDFReport } from '../../services/pdfGenerator';
import { calculateMonthlySummary } from '../../services/summaryCalculator';
import { Accordion, AccordionItem } from '../ui/Accordion';
import Input from '../ui/Input';
import NumberInput from '../ui/NumberInput';

const reportDescriptions: Record<string, string> = {
    mdcf: "Generates the official Monthly Data Collection Format (MDCF) required for reporting.",
    roll_statement: "Creates a summary of student enrollment numbers by class and social category.",
    daily_consumption: "Produces a detailed, register-style log of daily meals, attendance, and expenditure for the selected month.",
    rice_requirement: "Generates a formal certificate for the monthly rice requirement based on enrollment and working days.",
    yearly_consumption_detailed: "A comprehensive yearly report with category-wise monthly breakdowns of consumption, stock, and funds."
};

// Helper function to convert Blob to a Data URL for embedding
const convertBlobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

type MdcfDataType = Partial<Pick<Settings, 'healthStatus' | 'inspectionReport' | 'cooks' | 'mmeExpenditure'>>;

const Reports: React.FC = () => {
    const { data } = useData();
    const { showToast } = useToast();

    const [reportType, setReportType] = useState('mdcf');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });
    
    const financialYearOptions = useMemo(() => {
        const currentMonth = new Date().getMonth(); // 0-11
        const currentYear = new Date().getFullYear();
        const endYear = currentMonth < 3 ? currentYear : currentYear + 1;
        const options = [];
        for (let i = 0; i < 5; i++) {
            const year = endYear - i;
            options.push(`${year - 1}-${year}`);
        }
        return options;
    }, []);
    const [selectedFinancialYear, setSelectedFinancialYear] = useState(financialYearOptions[0]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [pdfPreviewData, setPdfPreviewData] = useState<{ blobUrl: string; pdfBlob: Blob; filename: string; generationData?: MdcfDataType } | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [reportSummary, setReportSummary] = useState<Record<string, string | number> | null>(null);
    
    const [isMdcfModalOpen, setIsMdcfModalOpen] = useState(false);
    const [mdcfData, setMdcfData] = useState<MdcfDataType | null>(null);

    const initiateReportGeneration = () => {
        if (reportType === 'mdcf') {
            setMdcfData({
                healthStatus: JSON.parse(JSON.stringify(data.settings.healthStatus)),
                inspectionReport: JSON.parse(JSON.stringify(data.settings.inspectionReport)),
                cooks: JSON.parse(JSON.stringify(data.settings.cooks)),
                mmeExpenditure: data.settings.mmeExpenditure,
            });
            setIsMdcfModalOpen(true);
            return;
        }

        const summary = calculateMonthlySummary(data, selectedMonth);
        const { totals, closingBalance, monthEntries } = summary;
        
        let newSummary: Record<string, string | number> = {};
        const monthDate = new Date(`${selectedMonth}-02T00:00:00`);
        const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        switch (reportType) {
            case 'daily_consumption':
                 newSummary = { 'Report': 'Daily Consumption Register', 'For Month': monthName, 'Total Meal Days': monthEntries.filter(e => e.totalPresent > 0).length, 'Rice Consumed': `${totals.rice.toFixed(3)} kg`, 'Total Expenditure': `₹${totals.expenditure.toFixed(2)}` };
                break;
            case 'roll_statement':
                const totalEnrollment = data.settings.classRolls.reduce((sum, c) => sum + c.general.boys + c.general.girls + c.stsc.boys + c.stsc.girls, 0);
                newSummary = { 'Report': 'Roll Statement', 'Total Enrollment': totalEnrollment };
                break;
            case 'rice_requirement':
                 const workingDays = monthEntries.filter(e => e.totalPresent > 0).length;
                 const enrollment = data.settings.classRolls.reduce((sum, c) => sum + c.general.boys + c.general.girls + c.stsc.boys + c.stsc.girls, 0);
                 const totalRiceKg = data.settings.classRolls.reduce((total, c) => {
                     let cat: Category | null = null;
                     if (['bal', 'pp1', 'pp2'].includes(c.id)) cat = 'balvatika';
                     else if (['c1', 'c2', 'c3', 'c4', 'c5'].includes(c.id)) cat = 'primary';
                     else if (['c6', 'c7', 'c8'].includes(c.id)) cat = 'middle';
                     if (cat) {
                         const classRoll = c.general.boys + c.general.girls + c.stsc.boys + c.stsc.girls;
                         total += (classRoll * workingDays * data.settings.rates.rice[cat]) / 1000;
                     }
                     return total;
                 }, 0);
                newSummary = { 'Report': 'Rice Requirement Certificate', 'For Month': monthName, 'Total Enrollment': enrollment, 'Working Days': workingDays, 'Total Rice Required': `${totalRiceKg.toFixed(3)} kg` };
                break;
            case 'yearly_consumption_detailed':
                newSummary = { 'Report': 'Detailed Yearly Consumption Report', 'For Financial Year': selectedFinancialYear, 'Note': 'This report shows category-wise details for each month and may take time to generate.' };
                break;
        }

        setReportSummary(newSummary);
        setIsConfirmModalOpen(true);
    };

    const handleReportExport = (overrideData?: MdcfDataType) => {
        setIsGenerating(true);
        setTimeout(async () => {
            try {
                const parameter = ['yearly_consumption_detailed'].includes(reportType) ? selectedFinancialYear : selectedMonth;
                const { pdfBlob, filename } = generatePDFReport(reportType, data, parameter, overrideData);

                const dataUrl = await convertBlobToDataURL(pdfBlob);
                
                setPdfPreviewData({ 
                    blobUrl: dataUrl, 
                    pdfBlob: pdfBlob, 
                    filename: filename,
                    generationData: overrideData,
                });

                if (!isPreviewOpen) setIsPreviewOpen(true);
                showToast('Report generated successfully!', 'success');
            } catch (error: any) {
                console.error("PDF generation or conversion failed:", error);
                showToast(error.message || 'Failed to generate PDF report.', 'error');
            } finally {
                setIsGenerating(false);
            }
        }, 50);
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
        setPdfPreviewData(null);
    };
    
    const handleRegenerate = () => {
        handleClosePreview();
        setTimeout(() => {
            if (reportType === 'mdcf') {
                setIsMdcfModalOpen(true); // Re-open the details modal
            } else {
                initiateReportGeneration();
            }
        }, 100);
    };

    const handleMdcfChange = (section: keyof MdcfDataType, field: string, value: any) => {
        setMdcfData(prev => prev ? ({ ...prev, [section]: { ...(prev as any)[section], [field]: value } }) : null);
    };
    const handleMdcfCookChange = (id: string, field: keyof CookCumHelper, value: string | number) => {
        setMdcfData(prev => prev ? ({ ...prev, cooks: prev.cooks?.map(cook => cook.id === id ? { ...cook, [field]: value } : cook) }) : null);
    };

    const needsMonth = !['roll_statement', 'yearly_consumption_detailed'].includes(reportType);
    const needsYear = ['yearly_consumption_detailed'].includes(reportType);

    return (
        <>
            {isGenerating && (
                <div className="fixed inset-0 z-[101] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm" role="status" aria-live="polite">
                    <div className="flex flex-col items-center justify-center text-white">
                        <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg font-semibold">Generating Report...</p>
                        <p className="text-sm text-gray-300">Please wait a moment.</p>
                    </div>
                </div>
            )}
            <PDFPreviewModal
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                pdfUrl={pdfPreviewData?.blobUrl || ''}
                pdfBlob={pdfPreviewData?.pdfBlob || null}
                filename={pdfPreviewData?.filename || 'report.pdf'}
                onRegenerate={handleRegenerate}
            />
             <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Report Generation">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600 dark:text-gray-300">Please review the summary below before generating the PDF.</p>
                    {reportSummary && (
                        <div className="text-sm space-y-2 bg-amber-100/40 dark:bg-gray-800/50 p-3 rounded-lg">
                            {Object.entries(reportSummary).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <strong className="text-stone-700 dark:text-gray-300 pr-2">{key}:</strong>
                                    <span className="text-stone-900 dark:text-white text-right">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => { setIsConfirmModalOpen(false); handleReportExport(); }}>Generate PDF</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isMdcfModalOpen} onClose={() => setIsMdcfModalOpen(false)} title={`Details for MDCF Report - ${new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}`}>
                <div className="space-y-4">
                    <p className="text-sm text-stone-600 dark:text-gray-300 -mt-2">Confirm or edit the details for the selected month before generating the report. These changes are temporary and will not affect your main settings.</p>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {mdcfData && (
                            <Accordion defaultOpenId='health'>
                                <AccordionItem id="health" title="Health Status">
                                    <div className="grid grid-cols-2 gap-3">
                                        <NumberInput label="IFA Tablets (Boys)" id="m-ifa-boys" min={0} value={mdcfData.healthStatus?.ifaBoys || 0} onChange={v => handleMdcfChange('healthStatus', 'ifaBoys', v)} />
                                        <NumberInput label="IFA Tablets (Girls)" id="m-ifa-girls" min={0} value={mdcfData.healthStatus?.ifaGirls || 0} onChange={v => handleMdcfChange('healthStatus', 'ifaGirls', v)} />
                                        <NumberInput label="Screened by RBSK" id="m-screened-rbsk" min={0} value={mdcfData.healthStatus?.screenedByRBSK || 0} onChange={v => handleMdcfChange('healthStatus', 'screenedByRBSK', v)} />
                                        <NumberInput label="Referred by RBSK" id="m-referred-rbsk" min={0} value={mdcfData.healthStatus?.referredByRBSK || 0} onChange={v => handleMdcfChange('healthStatus', 'referredByRBSK', v)} />
                                    </div>
                                </AccordionItem>
                                <AccordionItem id="inspection" title="Inspection Report">
                                     <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-amber-100/50 dark:bg-gray-800/50 rounded-lg">
                                            <label htmlFor="m-inspected" className="font-medium text-stone-700 dark:text-gray-300 text-sm">Was an inspection done?</label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="m-inspected" className="sr-only peer" checked={mdcfData.inspectionReport?.inspected} onChange={e => handleMdcfChange('inspectionReport', 'inspected', e.target.checked)} />
                                                <div className="w-11 h-6 bg-stone-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                            </label>
                                        </div>
                                        {mdcfData.inspectionReport?.inspected && (
                                            <div>
                                                <label htmlFor="m-inspected-by" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Inspected by:</label>
                                                <select id="m-inspected-by" value={mdcfData.inspectionReport.inspectedBy} onChange={e => handleMdcfChange('inspectionReport', 'inspectedBy', e.target.value as InspectionAuthority)} className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500">
                                                    <option value="">Select Inspector</option>
                                                    <option value="Task Force">Task Force</option>
                                                    <option value="District Officials">District Officials</option>
                                                    <option value="Block Officials">Block Officials</option>
                                                    <option value="SMC Members">SMC Members</option>
                                                </select>
                                            </div>
                                        )}
                                        <NumberInput label="Untoward Incidents" id="m-incidents" min={0} value={mdcfData.inspectionReport?.incidentsCount || 0} onChange={v => handleMdcfChange('inspectionReport', 'incidentsCount', v)} />
                                    </div>
                                </AccordionItem>
                                <AccordionItem id="cooks" title="Cook-Cum-Helper Details">
                                    <div className="space-y-3">
                                    {mdcfData.cooks?.map((cook, index) => (
                                        <div key={cook.id} className="p-3 border border-amber-300/50 dark:border-gray-600 rounded-lg space-y-3">
                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Cook #{index + 1}: {cook.name}</p>
                                            <NumberInput label="Amount Paid this month (₹)" id={`m-cook-amount-${cook.id}`} min={0} value={cook.amountPaid} onChange={v => handleMdcfCookChange(cook.id, 'amountPaid', v)} />
                                        </div>
                                    ))}
                                    {(!mdcfData.cooks || mdcfData.cooks.length === 0) && <p className="text-xs text-center text-stone-500">No cooks found. Add them in settings.</p>}
                                    </div>
                                </AccordionItem>
                                <AccordionItem id="mme" title="MME Expenditure">
                                    <NumberInput label="MME Expenditure this month (₹)" id="m-mme-expenditure" min={0} value={mdcfData.mmeExpenditure || 0} onChange={v => setMdcfData(p => p ? {...p, mmeExpenditure: v} : null)} />
                                </AccordionItem>
                            </Accordion>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-amber-200/50 dark:border-white/10">
                        <Button variant="secondary" onClick={() => setIsMdcfModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => { setIsMdcfModalOpen(false); handleReportExport(mdcfData || undefined); }}>Generate PDF</Button>
                    </div>
                </div>
            </Modal>
        
            <div className="space-y-4">
                <Card title="Export Reports">
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="report-type" className="block text-xs font-medium mb-1 text-stone-600 dark:text-gray-300">Report Type</label>
                            <select 
                                id="report-type" 
                                value={reportType} 
                                onChange={e => setReportType(e.target.value)} 
                                className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5"
                            >
                                <option value="mdcf">Monthly Data Collection Format (MDCF)</option>
                                <option value="roll_statement">Roll Statement</option>
                                <option value="daily_consumption">Daily Consumption Register</option>
                                <option value="rice_requirement">Rice Requirement Certificate</option>
                                <option value="yearly_consumption_detailed">Yearly Consumption Report (Detailed)</option>
                            </select>
                            <p className="mt-1 text-xs text-stone-500 dark:text-gray-400">{reportDescriptions[reportType]}</p>
                        </div>
                        {needsMonth && (
                            <div>
                                <label htmlFor="month-select" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Select Month</label>
                                <input
                                    id="month-select"
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        )}
                         {needsYear && (
                             <div>
                                <label htmlFor="year-select" className="block text-xs font-medium text-stone-600 dark:text-gray-300 mb-1">Select Financial Year</label>
                                <select
                                    id="year-select"
                                    value={selectedFinancialYear}
                                    onChange={(e) => setSelectedFinancialYear(e.target.value)}
                                    className="w-full bg-amber-100/60 dark:bg-gray-700/50 border border-amber-300/50 dark:border-gray-600 text-stone-800 dark:text-white text-sm rounded-lg p-2.5 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    {financialYearOptions.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Button onClick={initiateReportGeneration} className="w-full" disabled={isGenerating}>
                            Generate & Preview PDF
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default Reports;