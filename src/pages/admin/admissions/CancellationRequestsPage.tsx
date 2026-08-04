import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import admissionService, { AdmissionApplication, AdmissionListResult } from '../../../services/admission.service';
import { 
  Search, Eye, CheckCircle2, Clock, XCircle, X, AlertTriangle, ArrowRight, CornerDownLeft, Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export const CancellationRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdmissionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modals state
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const result = await admissionService.listApplications({
        page,
        limit: 10,
        status: 'CANCELLATION_REQUESTED',
        search
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch cancellation requests', error);
      toast.error('Failed to fetch cancellation requests list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleOpenProcessModal = (app: AdmissionApplication, action: 'APPROVE' | 'REJECT') => {
    setSelectedApp(app);
    setProcessAction(action);
    setAdminRemarks('');
    setProcessModalOpen(true);
  };

  const handleProcessSubmit = async () => {
    if (!selectedApp || !processAction) return;
    setActionSubmitting(true);
    try {
      await admissionService.processCancellation(selectedApp.id, processAction, adminRemarks);
      toast.success(
        processAction === 'APPROVE'
          ? 'Admission cancellation approved successfully.'
          : 'Cancellation request rejected. Admission status restored to Confirmed.'
      );
      setProcessModalOpen(false);
      setSelectedApp(null);
      setProcessAction(null);
      setAdminRemarks('');
      fetchApplications();
    } catch (error: any) {
      console.error('Error processing cancellation:', error);
      toast.error(error.response?.data?.error || 'Failed to process cancellation request.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wide">
            Cancellation Requests
          </h2>
          <p className="text-xs font-bold text-neutral-450 mt-1">
            Review and process student requests for admission cancellation.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-5">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 size-4" />
            <input
              type="text"
              placeholder="Search by student name or admission number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-neutral-900 dark:text-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Requests Table */}
        <div className="overflow-x-auto border border-neutral-100 dark:border-neutral-800/60 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-450 font-black uppercase tracking-wider">
                <th className="p-4">Admission No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Admission Type</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Requested Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-neutral-700 dark:text-neutral-350 font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400 italic">
                    Loading requests...
                  </td>
                </tr>
              ) : !data || data.applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400 italic">
                    No cancellation requests found.
                  </td>
                </tr>
              ) : (
                data.applications.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-900/10 transition-colors">
                    <td className="p-4 font-bold text-neutral-900 dark:text-white">
                      {app.applicationNumber}
                    </td>
                    <td className="p-4">
                      {app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {app.branch?.name || 'N/A'}
                    </td>
                    <td className="p-4">
                      {app.admissionType || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-md font-bold text-[10px]">
                        {app.cancellationReason || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500">
                      {formatDate(app.cancellationRequestedAt)}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-405">
                        Pending Cancellation
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setViewModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-350 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                      <button
                        onClick={() => handleOpenProcessModal(app, 'APPROVE')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleOpenProcessModal(app, 'REJECT')}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-neutral-400">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg text-neutral-500 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg text-neutral-500 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Request Modal */}
      {viewModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                Cancellation Request Details
              </h3>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedApp(null);
                }}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-semibold text-neutral-700 dark:text-neutral-350 leading-relaxed">
              <div>
                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Student Name</p>
                <p className="text-neutral-900 dark:text-white font-extrabold mt-0.5">
                  {selectedApp.user ? `${selectedApp.user.firstName || ''} ${selectedApp.user.lastName || ''}`.trim() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Admission Number</p>
                <p className="text-neutral-900 dark:text-white font-extrabold mt-0.5">{selectedApp.applicationNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Branch / Stream</p>
                <p className="text-neutral-900 dark:text-white font-extrabold mt-0.5">{selectedApp.branch?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Cancellation Reason</p>
                <p className="mt-0.5">
                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-md font-bold text-[10px]">
                    {selectedApp.cancellationReason || 'N/A'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Requested Date</p>
                <p className="text-neutral-900 dark:text-white mt-0.5">{formatDate(selectedApp.cancellationRequestedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Student Remarks</p>
                <p className="text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 font-medium italic mt-1.5 whitespace-pre-line">
                  {selectedApp.cancellationRemarks ? `"${selectedApp.cancellationRemarks}"` : 'No remarks provided.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedApp(null);
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-350 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  handleOpenProcessModal(selectedApp, 'APPROVE');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Request Modal (Approve or Reject) */}
      {processModalOpen && selectedApp && processAction && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="space-y-2 text-neutral-900 dark:text-white">
              <h3 className="text-base font-black uppercase tracking-wide flex items-center gap-2">
                {processAction === 'APPROVE' ? (
                  <><CheckCircle2 className="text-emerald-500" size={20} /> Approve Cancellation</>
                ) : (
                  <><Ban className="text-rose-500" size={20} /> Reject Cancellation</>
                )}
              </h3>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {processAction === 'APPROVE' ? (
                  <>Are you sure you want to approve this cancellation request? This will permanently cancel the admission and transition the student's status to <strong>Admission Cancelled</strong>.</>
                ) : (
                  <>Are you sure you want to reject this cancellation request? This will restore the student's status back to <strong>Admission Confirmed</strong>.</>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-neutral-450 uppercase tracking-widest">
                Administrator Remarks
              </label>
              <textarea
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={3}
                placeholder="Enter remarks or justification for this decision..."
                className="w-full text-xs font-semibold p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-neutral-950 dark:text-white transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                disabled={actionSubmitting}
                onClick={() => {
                  setProcessModalOpen(false);
                  setProcessAction(null);
                  setAdminRemarks('');
                }}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-350 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={actionSubmitting}
                onClick={handleProcessSubmit}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-1.5 ${
                  processAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                }`}
              >
                {actionSubmitting ? 'Processing...' : processAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationRequestsPage;
