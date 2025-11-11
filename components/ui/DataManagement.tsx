import React, { useRef, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import { AppData } from '../../types';
import { validateImportData } from '../../services/dataValidator';

const DataManagement: React.FC = () => {
    const { data, importData, resetData, updateLastBackupDate } = useData();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Local Backup State
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [importConfirmation, setImportConfirmation] = useState<{ data: AppData; summary: Record<string, string | number> } | null>(null);

    const handleExport = () => {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const schoolName = (data.settings.schoolDetails.name || 'School').replace(/[\\/:"*?<>|.\s]+/g, '_');
            
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const dateString = `${yyyy}-${mm}-${dd}`;
            
            a.download = `PM_POSHAN_Backup_${schoolName}_${dateString}.json`;
            document.body.appendChild(a);
a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            showToast('Data exported successfully!', 'success');
            updateLastBackupDate();
        } catch (error) {
            showToast('Error exporting data. Check browser permissions or try again.', 'error');
            console.error("Data export failed:", error);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Invalid file content');
                const parsedData = JSON.parse(text);
                const { isValid, errors, summary } = validateImportData(parsedData);

                if (!isValid) {
                    errors.forEach(err => showToast(err, 'error'));
                    showToast('Import failed. The file is invalid or corrupted.', 'error');
                    return;
                }
                setImportConfirmation({ data: parsedData as AppData, summary });
            } catch (error) {
                showToast('Failed to read or parse the file. It may be corrupted.', 'error');
                console.error(error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };
    
    const handleConfirmImport = () => {
        if (importConfirmation) {
            importData(importConfirmation.data);
            setImportConfirmation(null);
        }
    };

    const handleReset = () => {
        resetData();
        setResetModalOpen(false);
    };

    return (
        <>
            <Modal isOpen={isResetModalOpen} onClose={() => setResetModalOpen(false)} title="Confirm Reset">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Are you sure you want to delete ALL data? This action cannot be undone. It is highly recommended to export your data first.</p>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setResetModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleReset}>Yes, Reset Data</Button>
                </div>
            </Modal>
            
            <Modal isOpen={!!importConfirmation} onClose={() => setImportConfirmation(null)} title="Confirm Data Import">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Please review the details from the file before importing.
                        <strong className="block mt-1 text-yellow-600 dark:text-yellow-400">Warning: This will overwrite all current application data.</strong>
                    </p>
                    <div className="text-sm space-y-2 bg-slate-100/40 dark:bg-slate-800/50 p-3 rounded-lg">
                        <p><strong>School Name:</strong> {importConfirmation?.summary.schoolName}</p>
                        <p><strong>UDISE:</strong> {importConfirmation?.summary.udise}</p>
                        <p><strong>Daily Entries Found:</strong> {importConfirmation?.summary.entryCount}</p>
                        <p><strong>Receipts Found:</strong> {importConfirmation?.summary.receiptCount}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setImportConfirmation(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleConfirmImport}>Confirm & Overwrite</Button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-4">
                <Card title="Data Backup & Restore">
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium mb-1">Export Data (Local File)</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                Save all app data to a file. Store it safely to prevent data loss.
                            </p>
                            <Button onClick={handleExport} className="w-full">Export to JSON</Button>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">Import Data (Local File)</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                Restore data from a backup file. <span className="font-bold text-yellow-600 dark:text-yellow-400">Warning: Replaces all current data.</span>
                            </p>
                            <Button onClick={handleImportClick} variant="secondary" className="w-full">Select File to Import</Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                        </div>
                    </div>
                </Card>

                <Card title="Reset Application">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span className="font-bold text-red-600 dark:text-red-400">This action is irreversible.</span> It will permanently delete all data. Ensure you have a backup if you wish to restore later.
                    </p>
                    <Button onClick={() => setResetModalOpen(true)} variant="danger" className="w-full">Reset All Data</Button>
                </Card>

                <Card title="Help & About">
                    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                         <div>
                            <h3 className="font-semibold text-sky-700 dark:text-sky-400">App Guide</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                A quick guide to the app's main functions:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
                                <li><b>Dashboard:</b> Your daily hub. Add/edit today's meal entry and see a monthly overview.</li>
                                <li><b>Summary:</b> View detailed monthly breakdowns of consumption and stock balances.</li>
                                <li><b>Receipts:</b> Log all incoming rice and cash to keep your records accurate.</li>
                                <li><b>Reports:</b> Generate PDF reports and manage your application data.</li>
                                <li><b>Settings:</b> Crucial for accuracy! Configure your school details, enrollment, and food rates here.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sky-700 dark:text-sky-400">Feedback & Support</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Have questions or suggestions? Your feedback is valuable! Please get in touch.
                            </p>
                        </div>
                        <div className="text-xs pt-2 border-t border-slate-200/50 dark:border-white/10">
                            <p><strong>App Version:</strong> 2.1.0</p>
                            <p><strong>Developer:</strong> Imran Gani Mugloo</p>
                            <p><strong>Contact:</strong> <a href="tel:+919149690096" className="text-sky-600 dark:text-sky-400 hover:underline">+91 9149690096</a></p>
                            <p><strong>Email:</strong> <a href="mailto:emraanmugloo123@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">emraanmugloo123@gmail.com</a></p>
                            <p><strong>Website:</strong> <a href="https://imransir09.github.io/Pm-Poshan-Track/" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">Pm-Poshan-Track</a></p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default DataManagement;