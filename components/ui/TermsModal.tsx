
import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Terms and Conditions" zIndex="z-[60]">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-xs">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
                <p>Please read these Terms and Conditions ("Terms") carefully before using the PM POSHAN Tracker application (the "Service").</p>
                
                <h4 className="font-bold text-sky-700 dark:text-sky-400">1. Acceptance of Terms</h4>
                <p>By creating an account and using this Service, you signify your acceptance of these Terms. If you do not agree to these Terms, you may not use the Service.</p>

                <h4 className="font-bold text-sky-700 dark:text-sky-400">2. Description of Service</h4>
                <p>The PM POSHAN Tracker is an offline-first application designed to help schools manage and track data related to the PM-POSHAN (Mid-Day Meal) scheme. All data you enter is stored locally on your device.</p>
                
                <h4 className="font-bold text-sky-700 dark:text-sky-400">3. Data Privacy and Storage</h4>
                <p>
                    <strong>All data entered into this application is stored exclusively on your local device (phone, tablet, or computer).</strong> The application does not transmit this data to any external server, and the developer has no access to your information. You are solely responsible for the security and backup of your data. It is strongly recommended to use the "Export Data" feature regularly to create backups.
                </p>

                <h4 className="font-bold text-sky-700 dark:text-sky-400">4. User Account and Security</h4>
                <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree to create a secure password and not to disclose it to any third party.</p>

                <h4 className="font-bold text-sky-700 dark:text-sky-400">5. User Responsibilities</h4>
                <p>You are responsible for the accuracy and legality of all data you enter into the application. The Service is a tool to aid in record-keeping and reporting; it is your responsibility to ensure the data aligns with official requirements.</p>

                <h4 className="font-bold text-sky-700 dark:text-sky-400">6. Disclaimer of Warranties</h4>
                <p>The Service is provided "AS IS" and "AS AVAILABLE", without warranty of any kind. We do not warrant that the service will be error-free. The developer is not responsible for any loss of data. Regular backups are your responsibility.</p>
                
                <h4 className="font-bold text-sky-700 dark:text-sky-400">7. Limitation of Liability</h4>
                <p>In no event shall the developer be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of data, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

                <h4 className="font-bold text-sky-700 dark:text-sky-400">8. Changes to Terms</h4>
                <p>We reserve the right to modify these Terms at any time. We will do our best to provide notice of any changes. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
                
                <h4 className="font-bold text-sky-700 dark:text-sky-400">9. Contact Information</h4>
                <p>If you have any questions about these Terms, please contact the developer using the information provided in the "Help & About" section of the application.</p>
            </div>
            <div className="mt-4 text-right">
                <Button onClick={onClose} variant="secondary">Close</Button>
            </div>
        </Modal>
    );
};

export default TermsModal;
