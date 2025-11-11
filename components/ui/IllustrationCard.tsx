
import React from 'react';
import Card from './Card';

interface IllustrationCardProps {
    inchargeName?: string;
    inchargeContact?: string;
}

const IllustrationCard: React.FC<IllustrationCardProps> = ({ inchargeName, inchargeContact }) => {
    const showInchargeDetails = inchargeName && inchargeName.trim() !== '';

    return (
        <Card className="!p-0 overflow-hidden relative bg-gradient-to-br from-sky-500 to-teal-400 dark:from-slate-900 dark:to-sky-900">
            <div className="p-4 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-white">Welcome!</h2>
                        <p className="text-sm text-sky-100 dark:text-slate-300 max-w-xs">
                            Nourishing the Future, One Meal at a Time.
                        </p>
                    </div>
                     {showInchargeDetails && (
                        <div className="text-right text-xs flex-shrink-0 ml-2">
                            <p className="font-semibold text-white truncate">{inchargeName}</p>
                            <p className="text-sky-200 dark:text-slate-400">MDM Incharge</p>
                            {inchargeContact && <p className="text-sky-200 dark:text-slate-400">{inchargeContact}</p>}
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 z-0 opacity-20 dark:opacity-40">
                <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#2dd4bf', stopOpacity: 0.2 }} />
                        </linearGradient>
                         <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {/* Sun / Abstract background shape */}
                    <circle cx="250" cy="50" r="70" fill="url(#skyGradient)" filter="url(#glow)" />
                    
                    {/* Abstract ground */}
                    <path d="M -10 120 Q 150 90, 310 120" fill="#0f172a" opacity="0.5" />

                    {/* School building */}
                    <g transform="translate(40, 60)" fill="#e0f2fe" opacity="0.8">
                        <path d="M 0 60 L 0 20 L 25 0 L 50 20 L 50 60 Z" />
                        <rect x="15" y="35" width="20" height="25" fill="#0ea5e9" />
                    </g>
                    
                    {/* Abstract child figures */}
                    <g transform="translate(130, 75)" fill="#67e8f9" opacity="0.9">
                       <circle cx="10" cy="10" r="6" />
                       <path d="M 10 16 A 10 10 0 0 1 10 35 A 10 10 0 0 1 10 16 Z" />
                    </g>
                     <g transform="translate(160, 80)" fill="#e0f2fe" opacity="0.8">
                       <circle cx="10" cy="10" r="5" />
                       <path d="M 10 15 A 8 8 0 0 1 10 30 A 8 8 0 0 1 10 15 Z" />
                    </g>

                     {/* Book Icon */}
                    <g transform="translate(200, 85) scale(0.3)" fill="#f0f9ff">
                        <path d="M2,2 L2,28 L15,24 L28,28 L28,2 L15,6 L2,2 Z M15,6 L15,24" stroke="#93c5fd" strokeWidth="3"/>
                    </g>

                </svg>
            </div>
        </Card>
    );
};

export default IllustrationCard;
