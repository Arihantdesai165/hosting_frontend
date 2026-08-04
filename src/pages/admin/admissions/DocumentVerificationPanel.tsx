import React, { useState } from 'react';
import { FileText, CheckCircle2, XCircle, AlertCircle, Maximize2, ExternalLink } from 'lucide-react';

interface DocumentInfo {
  id: string;
  name: string;
  url: string | null;
  status: string;
  notes?: string;
}

interface DocumentVerificationPanelProps {
  documents: {
    photoUrl: string | null;
    signatureUrl: string | null;
    tenthMarksheetUrl: string | null;
    twelfthMarksheetUrl: string | null;
    diplomaSemester5MarksheetUrl?: string | null;
    diplomaSemester6MarksheetUrl?: string | null;
    cetScoreCardUrl: string | null;
    aadhaarUrl: string | null;
    casteCertificateUrl: string | null;
    domicileCertificateUrl: string | null;
    gapCertificateUrl: string | null;
    feesPaidReceiptUrl: string | null;
  };
  onDocumentStatusChange: (docId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => void;
}

export const DocumentVerificationPanel: React.FC<DocumentVerificationPanelProps> = ({ documents, onDocumentStatusChange }) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentInfo | null>(null);

  const docList: DocumentInfo[] = [
    { id: 'photo', name: 'Passport Photo', url: documents.photoUrl, status: 'PENDING' },
    { id: 'signature', name: 'Signature', url: documents.signatureUrl, status: 'PENDING' },
    { id: 'tenth', name: '10th Marksheet', url: documents.tenthMarksheetUrl, status: 'PENDING' },
    { id: 'twelfth', name: '12th Marksheet', url: documents.twelfthMarksheetUrl, status: 'PENDING' },
    { id: 'diplomaSemester5', name: 'Diploma 5th Sem Marksheet', url: documents.diplomaSemester5MarksheetUrl || null, status: 'PENDING' },
    { id: 'diplomaSemester6', name: 'Diploma 6th Sem Marksheet', url: documents.diplomaSemester6MarksheetUrl || null, status: 'PENDING' },
    { id: 'cet', name: 'CET Score Card', url: documents.cetScoreCardUrl, status: 'PENDING' },
    { id: 'aadhaar', name: 'Aadhaar Card', url: documents.aadhaarUrl, status: 'PENDING' },
    { id: 'caste', name: 'Caste Certificate', url: documents.casteCertificateUrl, status: 'PENDING' },
    { id: 'domicile', name: 'Domicile Certificate', url: documents.domicileCertificateUrl, status: 'PENDING' },
    { id: 'gap', name: 'Gap Certificate', url: documents.gapCertificateUrl, status: 'PENDING' },
    { id: 'feesPaidReceipt', name: 'Fees Paid Receipt', url: documents.feesPaidReceiptUrl, status: 'PENDING' },
  ].filter(doc => doc.url !== null && doc.url !== undefined); // Only show uploaded docs

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      {/* Left List of Documents */}
      <div className="w-full md:w-1/3 flex flex-col gap-3 overflow-y-auto pr-2">
        {docList.map(doc => (
          <div 
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedDoc?.id === doc.id ? 'border-violet-500 bg-violet-50' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <span className="text-sm font-bold text-neutral-800">{doc.name}</span>
            </div>
            {doc.status === 'VERIFIED' && <CheckCircle2 className="text-emerald-500" size={16} />}
            {doc.status === 'REJECTED' && <XCircle className="text-rose-500" size={16} />}
            {doc.status === 'PENDING' && <AlertCircle className="text-amber-500" size={16} />}
          </div>
        ))}
      </div>

      {/* Right Document Preview pane */}
      <div className="w-full md:w-2/3 flex flex-col bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 relative">
        {selectedDoc ? (
          <>
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-3 flex items-center justify-between z-10">
              <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{selectedDoc.name}</h4>
              <div className="flex gap-2">
                <a href={selectedDoc.url || '#'} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-600">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <div className="flex-1 overflow-auto relative flex items-center justify-center p-4">
               {selectedDoc.url?.toLowerCase().endsWith('.pdf') ? (
                 <iframe src={selectedDoc.url} className="w-full h-full rounded-lg border border-neutral-200" title={selectedDoc.name} />
               ) : (
                 <img src={selectedDoc.url!} alt={selectedDoc.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
               )}
            </div>
            <div className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 flex items-center justify-between gap-4">
              <input type="text" placeholder="Add rejection note..." className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onDocumentStatusChange(selectedDoc.id, 'REJECTED')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm rounded-lg transition-colors border border-rose-200"
                >
                  Reject
                </button>
                <button 
                  onClick={() => onDocumentStatusChange(selectedDoc.id, 'VERIFIED')}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm rounded-lg transition-colors border border-emerald-200"
                >
                  Verify Document
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="font-semibold text-sm">Select a document from the list to review</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerificationPanel;