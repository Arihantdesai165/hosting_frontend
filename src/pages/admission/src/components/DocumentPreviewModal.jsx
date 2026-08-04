import React from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

const DocumentPreviewModal = ({ isOpen, onClose, documentUrl, documentLabel }) => {
    const [zoom, setZoom] = React.useState(1);

    if (!isOpen || !documentUrl) return null;

    const fullUrl = documentUrl.startsWith('http')
        ? documentUrl
        : `${window.location.protocol}//${window.location.hostname}:5000/${documentUrl.replace(/\\/g, '/')}`;

    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(documentUrl);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">{documentLabel || 'Document Preview'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Preview uploaded document</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isImage && (
                            <>
                                <button
                                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition-colors"
                                    title="Zoom out"
                                >
                                    <ZoomOut size={14} />
                                </button>
                                <span className="text-xs font-mono font-bold text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                                <button
                                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition-colors"
                                    title="Zoom in"
                                >
                                    <ZoomIn size={14} />
                                </button>
                            </>
                        )}
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
                            title="Open in new tab"
                        >
                            <Download size={14} />
                        </a>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition-colors ml-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-slate-100/50 flex items-center justify-center min-h-[400px]">
                    {isImage ? (
                        <img
                            src={fullUrl}
                            alt={documentLabel}
                            className="max-w-full rounded-lg shadow-lg transition-transform duration-300"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                                e.target.alt = 'Failed to load image';
                            }}
                        />
                    ) : (
                        <iframe
                            src={fullUrl}
                            className="w-full h-[70vh] rounded-lg border border-slate-200"
                            title={documentLabel}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
