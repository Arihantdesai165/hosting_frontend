import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import { buildFileUrl } from '../../../utils/file.utils';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Maximize2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── ERROR BOUNDARY FOR REVIEW WORKSPACE ──────────────────────────────────────
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ReviewWorkspaceErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ReviewWorkspace] ReviewWorkspaceErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#F3F6FA] flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Review Workspace Component Exception</h2>
            <p className="text-xs font-semibold text-slate-500">
              An unexpected render exception occurred inside the Review Workspace:
            </p>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-700 font-mono text-xs text-left w-full overflow-auto max-h-36 border border-rose-200">
              {this.state.error?.message || String(this.state.error)}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── INTERFACES ───────────────────────────────────────────────────────────────
export interface DocumentItem {
  id: string;
  field: string;
  name: string;
  url: string | null;
  blobUrl?: string | null;
  isPdf?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  rejectionRemarks?: string;
  loadError?: boolean;
}

interface DocumentVerificationWorkspaceProps {
  isOpen?: boolean;
  onClose?: () => void;
  appId?: string;
  studentName?: string;
  appNumber?: string;
  appStatus?: string;
  documents?: Record<string, any> | null;
  initialDocStatus?: Record<string, 'ACCEPTED' | 'REJECTED'>;
  onCompleteVerification?: (updatedDocStatuses: Record<string, 'ACCEPTED' | 'REJECTED'>, allVerified: boolean) => void;
}

const extractDocUrl = (docSource: any, keys: string[]): string | null => {
  if (!docSource) return null;

  if (Array.isArray(docSource)) {
    for (const item of docSource) {
      if (item && typeof item === 'object') {
        const itemField = (item.field || item.id || item.name || '').toLowerCase();
        for (const k of keys) {
          if (itemField.includes(k.toLowerCase()) && item.url) {
            const resolved = buildFileUrl(item.url);
            console.log("Original:", item.url);
            console.log("Resolved:", resolved);
            return resolved;
          }
        }
      } else if (typeof item === 'string') {
        for (const k of keys) {
          if (item.toLowerCase().includes(k.toLowerCase())) {
            const resolved = buildFileUrl(item);
            console.log("Original:", item);
            console.log("Resolved:", resolved);
            return resolved;
          }
        }
      }
    }
  }

  if (typeof docSource === 'object') {
    for (const k of keys) {
      if (docSource[k] !== undefined && docSource[k] !== null && docSource[k] !== '') {
        const resolved = buildFileUrl(docSource[k]);
        console.log("Original:", docSource[k]);
        console.log("Resolved:", resolved);
        return resolved;
      }
    }
  }

  return null;
};

// ─── WORKSPACE COMPONENT ──────────────────────────────────────────────────────
export const DocumentVerificationWorkspaceContent: React.FC<DocumentVerificationWorkspaceProps> = ({
  isOpen,
  onClose,
  appId: propAppId,
  studentName: propStudentName,
  appNumber: propAppNumber,
  appStatus: propAppStatus,
  documents: propDocuments,
  initialDocStatus = {},
  onCompleteVerification
}) => {
  const { id: urlAppId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const targetAppId = propAppId || urlAppId;
  const effectiveIsOpen = isOpen ?? true;

  const [docList, setDocList] = useState<DocumentItem[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingBlobs, setLoadingBlobs] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [studentNameState, setStudentNameState] = useState<string>(propStudentName || '');
  const [appNumberState, setAppNumberState] = useState<string>(propAppNumber || '');

  // Viewer Tools state
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Blurred Image');
  const [rejectRemarks, setRejectRemarks] = useState<string>('');

  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const resetViewer = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    resetViewer();
  }, [currentDocumentIndex]);

  // Stage 5 & 10: Component Mount & Document Initialization
  useEffect(() => {
    console.log("Review Workspace Mounted");

    if (!effectiveIsOpen) return;

    let active = true;
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);

    const initWorkspace = async () => {
      try {
        let workspaceData: any = null;
        let safeDocs: any = propDocuments || {};
        let nameToUse = propStudentName || '';
        let numberToUse = propAppNumber || '';

        // Stage 1, 2, 3 & 9: Fetch workspaceData and log for debugging
        if (targetAppId) {
          console.log("API request sent to fetch application/documents for ID:", targetAppId);
          try {
            const res = await API.get(`/admin/admissions/${targetAppId}`);
            console.log("API response received:", res.data);
            workspaceData = res.data?.data || res.data;
            
            // Requirement 9 Logging:
            console.log(workspaceData);
            console.log(workspaceData?.documents || workspaceData?.studentdocuments);

            if (active && workspaceData) {
              safeDocs = workspaceData.studentdocuments || workspaceData.documents || safeDocs;
              const pd = workspaceData.studentpersonaldetails;
              nameToUse = `${pd?.firstName || ''} ${pd?.lastName || ''}`.trim() || workspaceData.user?.firstName || workspaceData.user?.email || nameToUse || 'Student';
              numberToUse = workspaceData.applicationNumber || numberToUse || '—';
            }
          } catch (apiErr: any) {
            console.error("API request failed:", apiErr);
            if (active && (!propDocuments || Object.keys(propDocuments).length === 0)) {
              setHasError(true);
              setErrorMessage(apiErr.response?.data?.error || apiErr.message || 'Failed to fetch application document details.');
              setIsLoading(false);
              return;
            }
          }
        }

        if (!active) return;

        setStudentNameState(nameToUse || 'Student');
        setAppNumberState(numberToUse || '—');

        console.log("Document initialization started. Setting current document index to 0.");

        const allPossibleDocs = [
          { id: 'photo', field: 'photo', name: 'Passport Size Photo', url: extractDocUrl(safeDocs, ['photoUrl', 'photo', 'passportPhoto', 'passportPhotoUrl']) },
          { id: 'signature', field: 'signature', name: 'Candidate E-Signature', url: extractDocUrl(safeDocs, ['signatureUrl', 'signature', 'candidateSignature']) },
          { id: 'tenth', field: 'tenthMarksheet', name: 'SSLC / 10th Marks Card', url: extractDocUrl(safeDocs, ['tenthMarksheetUrl', 'tenthMarksheet', 'sslcMarksheet', 'sslcMarksheetUrl', 'tenth']) },
          { id: 'twelfth', field: 'twelfthMarksheet', name: 'PUC / 12th Marks Card', url: extractDocUrl(safeDocs, ['twelfthMarksheetUrl', 'twelfthMarksheet', 'pucMarksheet', 'pucMarksheetUrl', 'twelfth']) },
          { id: 'diplomaSemester5', field: 'diplomaSemester5Marksheet', name: 'Diploma 5th Semester Marks Card', url: extractDocUrl(safeDocs, ['diplomaSemester5MarksheetUrl', 'diplomaSemester5Marksheet', 'diploma5thMarksheetUrl']) },
          { id: 'diplomaSemester6', field: 'diplomaSemester6Marksheet', name: 'Diploma 6th Semester Marks Card', url: extractDocUrl(safeDocs, ['diplomaSemester6MarksheetUrl', 'diplomaSemester6Marksheet', 'diploma6thMarksheetUrl']) },
          { id: 'cet', field: 'cetScoreCard', name: 'Entrance Score Card (CET/DCET)', url: extractDocUrl(safeDocs, ['cetScoreCardUrl', 'cetScoreCard', 'entranceScoreCard', 'entranceScoreCardUrl', 'cet']) },
          { id: 'aadhaar', field: 'aadhaar', name: 'Aadhaar Card', url: extractDocUrl(safeDocs, ['aadhaarUrl', 'aadhaar', 'aadhaarCard', 'aadhaarCardUrl']) },
          { id: 'feesPaidReceipt', field: 'feesPaidReceipt', name: 'Fees Paid Receipt', url: extractDocUrl(safeDocs, ['feesPaidReceiptUrl', 'feesPaidReceipt', 'feeReceipt', 'feeReceiptUrl', 'admissionFeeReceiptUrl']) },
          { id: 'domicile', field: 'domicileCertificate', name: 'Study / Domicile Certificate', url: extractDocUrl(safeDocs, ['domicileCertificateUrl', 'domicileCertificate', 'studyCertificate']) },
          { id: 'caste', field: 'casteCertificate', name: 'Caste Certificate', url: extractDocUrl(safeDocs, ['casteCertificateUrl', 'casteCertificate']) },
          { id: 'gap', field: 'gapCertificate', name: 'Income / Gap Certificate', url: extractDocUrl(safeDocs, ['gapCertificateUrl', 'gapCertificate', 'incomeCertificate', 'incomeCertificateUrl']) },
        ];

        // Also check if safeDocs object contains any extra uploaded string URLs
        if (safeDocs && typeof safeDocs === 'object' && !Array.isArray(safeDocs)) {
          Object.entries(safeDocs).forEach(([key, val]) => {
            if (typeof val === 'string' && val.trim() !== '' && !key.endsWith('Id') && key !== 'createdAt' && key !== 'updatedAt' && key !== 'id') {
              const alreadyIncluded = allPossibleDocs.some(d => d.url === val);
              if (!alreadyIncluded) {
                const formattedName = key.replace(/Url$/, '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                allPossibleDocs.push({
                  id: key,
                  field: key,
                  name: formattedName,
                  url: val
                });
              }
            }
          });
        }

        // Filter uploaded documents
        const availableDocs: DocumentItem[] = allPossibleDocs
          .filter(d => d.url !== null && d.url !== undefined && d.url !== '')
          .map(d => {
            const initStatus = initialDocStatus[d.name];
            let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
            if (initStatus === 'ACCEPTED') status = 'APPROVED';
            if (initStatus === 'REJECTED') status = 'REJECTED';

            return {
              id: d.id,
              field: d.field,
              name: d.name,
              url: d.url,
              status
            };
          });

        setDocList(availableDocs);

        // Stage 10: Verify currentDocumentIndex is initialized to 0 after data loads
        setCurrentDocumentIndex(0);

        if (availableDocs.length === 0) {
          console.warn("No documents found for this application.");
          setIsLoading(false);
          return;
        }

        // Preload Blobs
        setLoadingBlobs(true);
        const updatedDocs = [...availableDocs];

        try {
          await Promise.all(
            updatedDocs.map(async (doc, idx) => {
              try {
                if (targetAppId && doc.field) {
                  const response = await API.get(`/admin/admissions/${targetAppId}/documents/${doc.field}`, {
                    responseType: 'blob'
                  });
                  if (!active) return;
                  const type = response.data?.type || '';
                  const isPdf = type.includes('pdf') || (typeof doc.url === 'string' && doc.url.toLowerCase().endsWith('.pdf'));
                  const blobUrl = URL.createObjectURL(response.data);
                  updatedDocs[idx] = { ...updatedDocs[idx], blobUrl, isPdf: !!isPdf };
                }
              } catch (err) {
                console.warn(`Fallback to direct url for field ${doc.field}:`, err);
                const isPdf = typeof doc.url === 'string' && doc.url.toLowerCase().endsWith('.pdf');
                updatedDocs[idx] = { ...updatedDocs[idx], isPdf: !!isPdf };
              }
            })
          );
        } catch (err) {
          console.error("Error preloading document blobs:", err);
        } finally {
          if (active) {
            setDocList(updatedDocs);
            setLoadingBlobs(false);
          }
        }
      } catch (err: any) {
        console.error("Error initializing DocumentVerificationWorkspace:", err);
        if (active) {
          setHasError(true);
          setErrorMessage(err.message || 'Failed to initialize workspace data');
        }
      } finally {
        if (active) {
          // Stage 7: Ensure loading state is always cleared
          setIsLoading(false);
        }
      }
    };

    initWorkspace();

    return () => {
      active = false;
    };
  }, [effectiveIsOpen, targetAppId, propDocuments, propStudentName, propAppNumber]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (urlAppId) {
      console.log("Navigating back to review sheet:", `/admin/admissions/review/${urlAppId}`);
      navigate(`/admin/admissions/review/${urlAppId}`);
    } else {
      navigate(-1);
    }
  };

  if (!effectiveIsOpen) return null;

  // Stage 7: Loading view
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F3F6FA] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-xl flex flex-col items-center text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Loading Review Workspace</h3>
          <p className="text-xs text-slate-500 font-medium">Fetching student records and initializing document viewer...</p>
        </div>
      </div>
    );
  }

  // Stage 9: Error Card if exception occurs
  if (hasError) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F3F6FA] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md w-full shadow-xl flex flex-col items-center text-center space-y-4">
          <AlertCircle size={48} className="text-rose-500" />
          <h3 className="text-base font-extrabold text-slate-900">Workspace Rendering Error</h3>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-700 font-mono text-xs text-left w-full overflow-auto max-h-32 border border-rose-200">
            {errorMessage || 'An error occurred while loading the document verification workspace.'}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </div>
    );
  }

  // Stage 8: Empty state screen ("No documents found.")
  if (docList.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F3F6FA] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-xl flex flex-col items-center text-center space-y-4">
          <FileText size={48} className="text-slate-400 opacity-40" />
          <h3 className="text-base font-extrabold text-slate-900">No documents found.</h3>
          <p className="text-xs font-semibold text-slate-500">There are no digital document certificates attached to this student application.</p>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-colors cursor-pointer"
          >
            Return to Review Sheet
          </button>
        </div>
      </div>
    );
  }

  // Stage 11: Verify currentDocument is not undefined before rendering
  const currentDocument: DocumentItem | null =
    docList.length > 0 && currentDocumentIndex >= 0 && currentDocumentIndex < docList.length
      ? docList[currentDocumentIndex]
      : docList[0] || null;

  const verifiedCount = docList.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = docList.filter(d => d.status === 'REJECTED').length;
  const pendingCount = docList.filter(d => d.status === 'PENDING').length;
  const totalDocs = docList.length;
  const progressPercent = totalDocs > 0 ? Math.round(((verifiedCount + rejectedCount) / totalDocs) * 100) : 0;
  const isAllReviewed = totalDocs > 0 && pendingCount === 0;

  // Viewer tool handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotateLeft = () => setRotation(prev => (prev - 90) % 360);
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!isFullscreen) {
      if (viewerContainerRef.current.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Drag / Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Auto Advance Helper
  const autoAdvance = (currentIdx: number, updatedList: DocumentItem[]) => {
    // Search for next pending document after current index
    const nextPendingIdxAfter = updatedList.findIndex((d, idx) => idx > currentIdx && d.status === 'PENDING');
    if (nextPendingIdxAfter !== -1) {
      setCurrentDocumentIndex(nextPendingIdxAfter);
      return;
    }

    // Search for any remaining pending document from start
    const anyPendingIdx = updatedList.findIndex(d => d.status === 'PENDING');
    if (anyPendingIdx !== -1) {
      setCurrentDocumentIndex(anyPendingIdx);
      return;
    }

    // If no more pending docs, stay on current document
    setCurrentDocumentIndex(currentIdx);
  };

  // Approve Handler
  const handleApproveCurrentDoc = () => {
    if (!currentDocument) return;

    const updatedList = docList.map((d, idx) =>
      idx === currentDocumentIndex
        ? { ...d, status: 'APPROVED' as const, rejectionReason: undefined, rejectionRemarks: undefined }
        : d
    );

    setDocList(updatedList);
    toast.success(`Approved: ${currentDocument.name}`);
    autoAdvance(currentDocumentIndex, updatedList);
  };

  // Reject Modal Submit Handler
  const handleConfirmRejectDoc = () => {
    if (!currentDocument) return;

    const updatedList = docList.map((d, idx) =>
      idx === currentDocumentIndex
        ? { ...d, status: 'REJECTED' as const, rejectionReason: rejectReason, rejectionRemarks: rejectRemarks }
        : d
    );

    setDocList(updatedList);
    setShowRejectModal(false);
    setRejectRemarks('');
    toast.error(`Rejected: ${currentDocument.name} (${rejectReason})`);
    autoAdvance(currentDocumentIndex, updatedList);
  };

  // Final Complete Handler
  const handleFinalizeWorkspace = () => {
    const updatedMap: Record<string, 'ACCEPTED' | 'REJECTED'> = {};
    docList.forEach(d => {
      if (d.status === 'APPROVED') updatedMap[d.name] = 'ACCEPTED';
      if (d.status === 'REJECTED') updatedMap[d.name] = 'REJECTED';
    });

    if (onCompleteVerification) {
      onCompleteVerification(updatedMap, isAllReviewed);
    }
    handleClose();
  };

  const handleDocumentLoadError = (docId: string) => {
    setDocList(prev =>
      prev.map(d => (d.id === docId ? { ...d, loadError: true } : d))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F3F6FA] flex flex-col w-full h-screen overflow-hidden font-sans select-none">
      
      {/* ─── 1. WORKSPACE TOP HEADER ─── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        
        {/* Left: Student Name & App Metadata */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#0B4F8A] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {studentNameState?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                {studentNameState}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                ADM NO: {appNumberState}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">
              Official Document Verification Workspace
            </p>
          </div>
        </div>

        {/* Center: Live Verification Progress Bar */}
        <div className="hidden md:flex flex-col items-center max-w-xs w-full px-4">
          <div className="flex items-center justify-between w-full text-xs font-extrabold mb-1">
            <span className="text-slate-600">Verification Progress</span>
            <span className="text-primary-700">{verifiedCount + rejectedCount} / {totalDocs} Reviewed</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-primary-600 to-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-3">
          {isAllReviewed && totalDocs > 0 ? (
            <button
              type="button"
              onClick={handleFinalizeWorkspace}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <ShieldCheck size={16} /> Complete Verification
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizeWorkspace}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Save & Exit
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Workspace"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

      </header>

      {/* ─── 2. TOOLBAR & VIEWER CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-[#F3F6FA]">
        
        {/* VIEWER CONTROL TOOLBAR */}
        <div className="h-12 bg-white/90 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 shadow-2xs">
          
          {/* Active Document Status Info */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold text-slate-800">
              {currentDocument ? currentDocument.name : 'Document Viewer'}
            </span>
            {currentDocument?.status === 'APPROVED' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={12} /> Approved
              </span>
            )}
            {currentDocument?.status === 'REJECTED' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <XCircle size={12} /> Rejected ({currentDocument.rejectionReason})
              </span>
            )}
            {currentDocument?.status === 'PENDING' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Clock size={12} /> Pending Review
              </span>
            )}
          </div>

          {/* Viewer Tools (Zoom In, Zoom Out, Rotate, Fullscreen, Reset) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom Out (-)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-700 px-1 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              title="Zoom In (+)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <button
              type="button"
              onClick={handleRotateLeft}
              title="Rotate Left (-90°)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              title="Rotate Right (+90°)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <RotateCw size={16} />
            </button>
            <button
              type="button"
              onClick={resetViewer}
              title="Reset View"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <Maximize2 size={15} />
            </button>
          </div>

        </div>

        {/* ─── 3. LARGE DOCUMENT DISPLAY CANVAS ─── */}
        <div
          ref={viewerContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 min-h-0 w-full bg-[#F3F6FA] relative flex items-center justify-center p-3 sm:p-5 overflow-hidden ${
            zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        >
          {/* WHITE ROUNDED CARD CANVAS CONTAINER */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 sm:p-4 max-w-full max-h-full flex items-center justify-center overflow-hidden relative">
            
            {loadingBlobs && !currentDocument?.blobUrl ? (
              <div className="w-[50vw] h-[40vh] flex flex-col items-center justify-center text-slate-500 gap-3">
                <div className="w-8 h-8 border-3 border-[#0B4F8A] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Loading Document File...</p>
              </div>
            ) : currentDocument ? (
              currentDocument.loadError ? (
                <div className="w-[50vw] h-[40vh] flex flex-col items-center justify-center text-slate-500 gap-3">
                  <AlertTriangle size={36} className="text-amber-500" />
                  <p className="text-xs font-bold text-slate-700">Document File Not Available or Unreadable</p>
                  <a
                    href={currentDocument.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-300"
                  >
                    Open Original Direct Link
                  </a>
                </div>
              ) : (
                <div
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                  }}
                  className="flex items-center justify-center max-w-full max-h-full"
                >
                  {currentDocument.isPdf ? (
                    <iframe
                      src={currentDocument.blobUrl || currentDocument.url!}
                      className="w-[75vw] h-[55vh] rounded-xl border border-slate-200 bg-white shadow-xs"
                      title={currentDocument.name}
                      onError={() => handleDocumentLoadError(currentDocument.id)}
                    />
                  ) : (
                    <img
                      src={currentDocument.blobUrl || currentDocument.url!}
                      alt={currentDocument.name}
                      onError={() => handleDocumentLoadError(currentDocument.id)}
                      className="block max-w-full max-h-[58vh] sm:max-h-[62vh] w-auto h-auto object-contain rounded-xl border border-slate-100 bg-white pointer-events-none shrink-0"
                    />
                  )}
                </div>
              )
            ) : (
              <div className="w-[50vw] h-[40vh] flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="opacity-30 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No document selected</p>
              </div>
            )}

          </div>

          {/* Quick Review Navigation Overlay Arrows */}
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <button
              type="button"
              onClick={() => {
                if (currentDocumentIndex > 0) setCurrentDocumentIndex(currentDocumentIndex - 1);
              }}
              disabled={currentDocumentIndex <= 0}
              className="p-3 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-0 transition-all border border-slate-200 pointer-events-auto shadow-lg cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <button
              type="button"
              onClick={() => {
                if (currentDocumentIndex < docList.length - 1) setCurrentDocumentIndex(currentDocumentIndex + 1);
              }}
              disabled={currentDocumentIndex >= docList.length - 1}
              className="p-3 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-0 transition-all border border-slate-200 pointer-events-auto shadow-lg cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>

        </div>

        {/* ─── 4. VERIFICATION ACTION BAR (Approve / Reject) ─── */}
        <div className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-2xs">
          
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Info size={15} className="text-primary-600" />
            <span>Approving or rejecting automatically switches to the next pending document while keeping the viewer stable.</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Reject Button */}
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              disabled={!currentDocument}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <XCircle size={16} /> Reject Document
            </button>

            {/* Approve Button */}
            <button
              type="button"
              onClick={handleApproveCurrentDoc}
              disabled={!currentDocument}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} /> Approve Document
            </button>
          </div>

        </div>

        {/* ─── 5. FIXED BOTTOM THUMBNAIL STRIP ─── */}
        <div className="h-24 bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-3 overflow-x-auto shrink-0 shadow-inner">
          {docList.map((doc, idx) => {
            const isSelected = idx === currentDocumentIndex;

            return (
              <div
                key={doc.id}
                onClick={() => setCurrentDocumentIndex(idx)}
                className={`flex flex-col items-center justify-between p-1.5 rounded-xl border cursor-pointer transition-all min-w-[105px] h-[74px] shrink-0 relative ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-500/30 shadow-md scale-105'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="w-full h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden relative">
                  {doc.blobUrl || doc.url ? (
                    doc.isPdf ? (
                      <div className="flex items-center justify-center text-rose-600 font-black text-[9px] gap-1">
                        <FileText size={12} /> PDF
                      </div>
                    ) : (
                      <img src={doc.blobUrl || doc.url!} alt={doc.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <FileText size={16} className="text-slate-400" />
                  )}

                  {/* Overlay Badges */}
                  {doc.status === 'APPROVED' && (
                    <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-2xs flex items-center justify-center text-white">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                  {doc.status === 'REJECTED' && (
                    <div className="absolute inset-0 bg-rose-600/80 backdrop-blur-2xs flex items-center justify-center text-white">
                      <XCircle size={18} />
                    </div>
                  )}
                </div>

                {/* Document Name */}
                <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center px-1">
                  {doc.name}
                </span>

                {/* Status Dot */}
                <div className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider">
                  {doc.status === 'APPROVED' && <span className="text-emerald-600">Verified</span>}
                  {doc.status === 'REJECTED' && <span className="text-rose-600">Rejected</span>}
                  {doc.status === 'PENDING' && <span className="text-slate-500">Pending</span>}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ─── REJECTION MODAL OVERLAY ─── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} /> Reject Document: {currentDocument?.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rejection Reason (Required)
                </label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500"
                >
                  <option value="Blurred Image">Blurred Image / Low Resolution</option>
                  <option value="Wrong Document">Wrong Document Category</option>
                  <option value="Incomplete Document">Incomplete / Cropped Document</option>
                  <option value="Unreadable">Unreadable Text / Corrupted File</option>
                  <option value="Duplicate Upload">Duplicate Upload</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Additional Remarks / Instructions for Student
                </label>
                <textarea
                  rows={3}
                  value={rejectRemarks}
                  onChange={e => setRejectRemarks(e.target.value)}
                  placeholder="Provide clear details on why this document is rejected..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectDoc}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Stage 12: Add Error Boundary around Review Workspace
export const DocumentVerificationWorkspace: React.FC<DocumentVerificationWorkspaceProps> = (props) => {
  return (
    <ReviewWorkspaceErrorBoundary>
      <DocumentVerificationWorkspaceContent {...props} />
    </ReviewWorkspaceErrorBoundary>
  );
};

export default DocumentVerificationWorkspace;
