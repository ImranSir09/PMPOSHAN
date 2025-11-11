
import React from 'react';
import Button from './Button';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    pdfBlob: Blob | null;
    filename: string;
    onRegenerate: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ isOpen, onClose, pdfUrl, pdfBlob, filename, onRegenerate }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        // Prioritize using the raw blob for downloading as it's more direct and reliable.
        if (pdfBlob) {
            const downloadUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
    
            // Use a timeout to ensure the browser has initiated the download
            // before the link is removed and the object URL is revoked.
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
            }, 100);
        } else {
            // Fallback to the provided URL if the blob isn't available.
            // This will work for data URIs but is less efficient.
            console.warn("PDF blob not available for download, falling back to URL.");
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm p-2 sm:p-4 pdf-preview-container" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title">
            <div className="flex-shrink-0 flex items-center justify-between pb-2 sm:pb-4 pdf-preview-header">
                <h3 id="pdf-preview-title" className="text-md sm:text-lg font-bold text-sky-300 truncate pr-2">{filename}</h3>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={onRegenerate} className="!px-3 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 hidden sm:inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm10 8a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Regen.
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()} className="!px-3 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 hidden sm:inline-block" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M5 4v3h10V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm-1 5a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1H4z" clipRule="evenodd" />
                           <path d="M3 9a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                        </svg>
                        Print
                    </Button>
                    <Button onClick={handleDownload} className="!px-3 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 hidden sm:inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download
                    </Button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Close PDF Preview">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex-grow bg-slate-700 rounded-lg overflow-hidden pdf-preview-content-area">
                <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full"
                    aria-label="PDF Preview"
                >
                    <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                        <p className="mb-4 text-lg">PDF preview is not available in your browser.</p>
                        <p className="text-sm mb-4">You can download the file to view it.</p>
                        <Button onClick={handleDownload}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download PDF
                        </Button>
                    </div>
                </object>
            </div>
        </div>
    );
};

export default PDFPreviewModal;
