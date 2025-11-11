import React, { useRef, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import { AppData } from '../../types';
import { validateImportData } from '../../services/dataValidator';
import PasswordInput from './PasswordInput';
import Input from './Input';

// Base64 encoding that is safe for Unicode characters
const safeBtoa = (str: string): string => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
}

// Base64 decoding that is safe for Unicode characters
const safeAtob = (b64: string): string => {
    try {
        return decodeURIComponent(atob(b64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
    } catch (e) {
        return atob(b64); // Fallback for non-unicode strings
    }
}

// Simple Vigenère-like cipher on character codes
const encrypt = (plainText: string, key: string): string => {
    if (!key) return plainText;
    let encryptedText = '';
    for (let i = 0; i < plainText.length; i++) {
        const charCode = plainText.charCodeAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        const encryptedCharCode = (charCode + keyCode) % 65536; // Use modulo to stay within char code range
        encryptedText += String.fromCharCode(encryptedCharCode);
    }
    return safeBtoa(encryptedText);
};

const decrypt = (b64CipherText: string, key: string): string => {
    if (!key) throw new Error('A password is required for decryption.');
    try {
        const cipherText = safeAtob(b64CipherText);
        let decryptedText = '';
        for (let i = 0; i < cipherText.length; i++) {
            const charCode = cipherText.charCodeAt(i);
            const keyCode = key.charCodeAt(i % key.length);
            const decryptedCharCode = (charCode - keyCode + 65536) % 65536; // Add 65536 to handle negative results
            decryptedText += String.fromCharCode(decryptedCharCode);
        }
        return decryptedText;
    } catch (e) {
        console.error("Decryption failed", e);
        throw new Error("Decryption failed. The data may be corrupted or the password is incorrect.");
    }
};

const DataManagement: React.FC = () => {
    const { data, importData, resetData, updateLastBackupDate } = useData();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // General State
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Please wait...');
    
    // Local Backup State
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [importConfirmation, setImportConfirmation] = useState<{ data: AppData; summary: Record<string, string | number> } | null>(null);

    // Cloud Sync State
    const [isBackupPasswordModalOpen, setIsBackupPasswordModalOpen] = useState(false);
    const [backupPassword, setBackupPassword] = useState('');
    const [confirmBackupPassword, setConfirmBackupPassword] = useState('');
    
    const [isSyncCodeModalOpen, setIsSyncCodeModalOpen] = useState(false);
    const [generatedSyncCode, setGeneratedSyncCode] = useState('');

    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [restoreSyncCode, setRestoreSyncCode] = useState('');

    const [isRestorePasswordModalOpen, setIsRestorePasswordModalOpen] = useState(false);
    const [restorePassword, setRestorePassword] = useState('');
    const [encryptedDataToRestore, setEncryptedDataToRestore] = useState<string | null>(null);

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

    const handleCreateBackup = async () => {
        if (backupPassword.length < 8) {
            showToast('Password must be at least 8 characters long.', 'error');
            return;
        }
        if (backupPassword !== confirmBackupPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Encrypting & Uploading...');
        setIsBackupPasswordModalOpen(false);

        try {
            const encryptedData = encrypt(JSON.stringify(data), backupPassword);
            
            const response = await fetch('/api/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: encryptedData }),
            });

            if (!response.ok) {
                throw new Error('Cloud backup failed. The server responded with an error.');
            }

            const { syncCode } = await response.json();
            setGeneratedSyncCode(syncCode);
            setIsSyncCodeModalOpen(true);
            updateLastBackupDate();
            showToast('Cloud backup created successfully!', 'success');

        } catch (error: any) {
            showToast(error.message || 'An unknown error occurred during backup.', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
            setBackupPassword('');
            setConfirmBackupPassword('');
        }
    };

    const handleFetchBackup = async () => {
        if (!restoreSyncCode.trim()) {
            showToast('Please enter a Sync Code.', 'error');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Fetching backup...');
        setIsRestoreModalOpen(false);

        try {
            const response = await fetch(`/api/backup?code=${restoreSyncCode.trim()}`);
            
            if (response.status === 404) {
                throw new Error('Invalid Sync Code or backup not found.');
            }
            if (!response.ok) {
                throw new Error('Failed to fetch backup from the server.');
            }

            const { data } = await response.json();
            setEncryptedDataToRestore(data);
            setIsRestorePasswordModalOpen(true);
        } catch (error: any) {
            showToast(error.message, 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecryptAndRestore = () => {
        if (!encryptedDataToRestore) {
            showToast('No data to restore.', 'error');
            return;
        }
        if (!restorePassword) {
            showToast('Password is required to decrypt the backup.', 'error');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Decrypting & Verifying...');
        setIsRestorePasswordModalOpen(false);
        
        try {
            const decryptedJson = decrypt(encryptedDataToRestore, restorePassword);
            const parsedData = JSON.parse(decryptedJson);

            const { isValid, errors, summary } = validateImportData(parsedData);
            if (!isValid) {
                errors.forEach(err => showToast(err, 'error'));
                throw new Error('Restore failed. Backup data is invalid or corrupted.');
            }
            
            setImportConfirmation({ data: parsedData as AppData, summary });
        } catch (error: any) {
            showToast(error.message, 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
            setRestorePassword('');
            setRestoreSyncCode('');
            setEncryptedDataToRestore(null);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedSyncCode).then(() => {
            showToast('Sync Code copied to clipboard!', 'success');
        }, () => {
            showToast('Failed to copy code.', 'error');
        });
    };


    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 z-[101] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm" role="status" aria-live="polite">
                    <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg font-semibold text-white">{loadingMessage}</p>
                </div>
            )}
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

            {/* Cloud Sync Modals */}
            <Modal isOpen={isBackupPasswordModalOpen} onClose={() => setIsBackupPasswordModalOpen(false)} title="Create Cloud Backup">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Create a password to encrypt your backup. This password is required to restore it. <strong className="text-yellow-600 dark:text-yellow-400">We cannot recover this password if you lose it.</strong></p>
                    <PasswordInput label="Password (min. 8 characters)" id="backup-password" value={backupPassword} onChange={e => setBackupPassword(e.target.value)} />
                    <PasswordInput label="Confirm Password" id="confirm-backup-password" value={confirmBackupPassword} onChange={e => setConfirmBackupPassword(e.target.value)} />
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsBackupPasswordModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateBackup}>Create Encrypted Backup</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSyncCodeModalOpen} onClose={() => setIsSyncCodeModalOpen(false)} title="Backup Successful!">
                <div className="space-y-4 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Your unique Sync Code is ready. <strong className="text-yellow-600 dark:text-yellow-400">Save this code somewhere safe. You will need it to restore your backup.</strong></p>
                    <div className="p-4 bg-slate-100/60 dark:bg-slate-900/80 rounded-lg">
                        <p className="text-3xl font-bold tracking-widest text-sky-700 dark:text-sky-400">{generatedSyncCode}</p>
                    </div>
                    <div className="flex space-x-2">
                        <Button onClick={copyToClipboard} variant="secondary" className="w-full">Copy Code</Button>
                        <Button onClick={() => setIsSyncCodeModalOpen(false)} className="w-full">Close</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} title="Restore from Cloud">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Enter the 6-character Sync Code you received when you created your backup.</p>
                    <Input 
                        label="Sync Code" 
                        id="restore-code" 
                        value={restoreSyncCode} 
                        onChange={e => setRestoreSyncCode(e.target.value)} 
                        maxLength={6} 
                        className="text-center tracking-widest font-mono text-lg"
                    />
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsRestoreModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleFetchBackup}>Fetch Backup</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRestorePasswordModalOpen} onClose={() => setIsRestorePasswordModalOpen(false)} title="Enter Password to Restore">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Enter the password used to encrypt this backup.</p>
                    <PasswordInput label="Backup Password" id="restore-password" value={restorePassword} onChange={e => setRestorePassword(e.target.value)} />
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsRestorePasswordModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleDecryptAndRestore}>Decrypt & Restore</Button>
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

                <Card title="Cloud Sync">
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Create an encrypted backup on the cloud and get a unique code to restore it on any device.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button onClick={() => setIsBackupPasswordModalOpen(true)} className="w-full">Create Backup</Button>
                            <Button onClick={() => setIsRestoreModalOpen(true)} variant="secondary" className="w-full">Restore from Cloud</Button>
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
                            <h3 className="font-semibold text-sky-700 dark:text-sky-400">Cloud Sync</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Safely back up and restore your data across devices.
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
                                <li><b>Secure & Encrypted:</b> When you back up, you'll be prompted to create a password. Your data is encrypted on your device *before* being uploaded.</li>
                                <li><b>Sync Code:</b> After a successful backup, you will receive a unique Sync Code. This code is the key to accessing your backup.</li>
                                <li><b>Easy Restore:</b> To restore data on any device, enter your Sync Code to fetch the backup, then provide your password to decrypt it.</li>
                                <li><b>Important:</b> Keep your password and Sync Code safe! We cannot recover them for you if they are lost.</li>
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