import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TermsModal from '../ui/TermsModal';
import PasswordInput from '../ui/PasswordInput';

const LoginPage: React.FC = () => {
    const { login, resetPassword } = useAuth();
    const { data } = useData();
    const { showToast } = useToast();
    
    const [password, setPassword] = useState('');
    const [isForgotModalOpen, setForgotModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!login(password)) {
            showToast('Incorrect password.', 'error');
        }
    };

    const handleResetPassword = () => {
        if (!securityAnswer || !newPassword) {
            showToast('Please fill in all fields.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        
        const success = resetPassword(securityAnswer, newPassword);
        if (success) {
            showToast('Password reset successfully! You can now log in.', 'success');
            setForgotModalOpen(false);
            setSecurityAnswer('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            showToast('Security answer is incorrect.', 'error');
        }
    };

    return (
        <>
            <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
            <Modal isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)} title="Reset Password">
                <div className="space-y-4">
                    <div>
                        <p className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Your Security Question:</p>
                        <p className="text-sm font-semibold text-sky-700 dark:text-sky-400 p-2 bg-slate-100/60 dark:bg-slate-700/50 rounded-lg">
                            {data.auth?.securityQuestion}
                        </p>
                    </div>
                    <Input
                        label="Your Answer"
                        id="reset-answer"
                        value={securityAnswer}
                        onChange={e => setSecurityAnswer(e.target.value)}
                    />
                     <PasswordInput
                        label="New Password (min. 6 characters)"
                        id="reset-new-password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                     <PasswordInput
                        label="Confirm New Password"
                        id="reset-confirm-password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setForgotModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword}>Reset Password</Button>
                    </div>
                </div>
            </Modal>

            <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-4">
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden">
                    <div className="animated-blob blob-1 bg-sky-300 dark:bg-sky-900"></div>
                    <div className="animated-blob blob-2 bg-teal-300 dark:bg-teal-900"></div>
                </div>
                <div className="w-full max-w-sm z-10">
                     <div className="text-center mb-4">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAbFBMVEX////8/Pz9/f0AAAD6+vr4+Pj29vbe3t7l5eX09PTq6urj4+Pn5+e/v7/Pz8+urq7X19fi4uKnp6fNzc2zs7OJiYmysrKhoaF7e3uCgoJSUlJwcHCbm5uioqJcXFxISEhaWlq6urqVlZWBgYGEhIRqamo4Mh5RAAADVklEQVR4nO2c6XqiMBCGSRRCiCIiCrjits5s//93HLpTEy1wEULCOfNeL5O0B29hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE5sR6n/T4n0xJ7Lp+U6/T5Osy2zWZZN+tX9Q91T6tFaqT6N1L/VvdQ99R6l/rP1g37v/qvTf1r30P7V/qfO4e6x9R+pf4/dw51j6tV6u9sOaTe2+l3a+h+p344x5T6/Xo8l/rZPMa0en+L++F+Ma1ev5PzS71jXF3q354D6v+P+R8+P9Q/hY+X+o/zof4h9U/zof4h9U/zof4h9S/wn0P/Uf6H+KfY/+H+t/if2P8U+z+w/8P9b/E/sf8p9n9g/4f73+J/Yv9T7P/A/g/3v8X/xP6n2P+B/R/uf4v/if1Pse919f8H9v/1e6j3+tD22zTbdVp/J/s/sP/D/W/xP7H/KfZ/YP+H+9/if2L/U+z/wP4P97/F/8T+p9j/gX0f/2+V+p+k/s2l/m2V+h9L/R+V+u9U6n+h1P9aqf9lqv9pqu8p9Z+m+o5S/w+qf6v6+9T/VfV3qf9N9fep/03196n/TfX3qf9N9fep/031d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/96n/d1H/d6r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/e1X/96r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/f1X/D6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/r6r/VlX/tVVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6n/dlUvqf92VS+p/3ZVL6lUvp/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/vVTS+p/uPqfkv9pqv+J/b/N/i/o/z3qf2/977X/t+X+Fw71v8b+X2X/b+r/TfV3Uf93q/8bVf9NVf9lqv/VlUspqf52VS+p/a9V/9v8X9n9h/+eK/xP7v17/A/s/wv6v1//E/g/s/wj7v17/A/s/wv6v1//E/g/s/wj7P/A/hP0f6H+L/R/Y/4H+p9j/gX0f6H+L/R/Y/4H+p9j/gX0f6H+L/R/Y/4H+p9j/Qf1/gP0f1H8f2P8B/f8F/l/Q/674f1/+f1H/B/r/hP3/xP5/4f8H+v+c/b8t/2/J/zfp/8r0f6f6r1X9u/V/Zftv1/9z6//s/L/c/7PyP8r8d8b+W+P+X/D/jfyP5H8p/0/7d23/7v3/b/j/b/j/7/L/1/n/rfN/o/zf6v5X/P9P+5/hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh+L/8BlQd79tC3/GAAAAAAElFTkSuQmCC" alt="PM Poshan Logo" className="h-16 w-16 rounded-full inline-block mb-2" />
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, {data.auth?.username}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-300">PM Poshan Pro</p>
                    </div>
                    <Card>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <PasswordInput
                                label="Password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" className="w-full">Login</Button>
                            <button
                                type="button"
                                onClick={() => setForgotModalOpen(true)}
                                className="block w-full text-center text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 text-xs pt-1"
                            >
                                Forgot Password?
                            </button>
                        </form>
                    </Card>
                     <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => setIsTermsModalOpen(true)}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                        >
                            View Terms and Conditions
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;