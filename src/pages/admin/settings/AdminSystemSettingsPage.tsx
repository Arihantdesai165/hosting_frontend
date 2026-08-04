import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import toast from 'react-hot-toast';
import { Settings, ShieldCheck, ShieldAlert, CalendarDays, Loader2 } from 'lucide-react';
import { getAcademicYear } from '../../../utils/date.util';

const generateAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let i = 0; i <= 4; i++) {
    const y = currentYear + i;
    options.push(`${y}-${y + 1}`);
  }
  return options;
};

const ACADEMIC_YEAR_OPTIONS = generateAcademicYearOptions();

const AdminSystemSettingsPage: React.FC = () => {
  const [admissionOpen, setAdmissionOpen] = useState<boolean>(true);
  const [academicYear, setAcademicYear] = useState<string>(getAcademicYear());
  const [closingDate, setClosingDate] = useState<string>('2026-08-31T23:59');
  const [handbookUrl, setHandbookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingToggle, setUpdatingToggle] = useState<boolean>(false);
  const [updatingYear, setUpdatingYear] = useState<boolean>(false);
  const [updatingClosingDate, setUpdatingClosingDate] = useState<boolean>(false);
  const [uploadingHandbook, setUploadingHandbook] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/settings');
      if (res.data?.success && res.data?.data) {
        setAdmissionOpen(res.data.data.admissionOpen ?? true);
        if (res.data.data.admissionCycle) {
          setAcademicYear(res.data.data.admissionCycle);
        }
        if (res.data.data.admissionClosingDate) {
          const d = new Date(res.data.data.admissionClosingDate);
          const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setClosingDate(isoLocal);
        }
        if (res.data.data.handbookUrl) {
          setHandbookUrl(res.data.data.handbookUrl);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newStatus: boolean) => {
    if (updatingToggle) return;
    setUpdatingToggle(true);
    setAdmissionOpen(newStatus); // Optimistic UI update

    try {
      const res = await API.put('/admin/settings', { admissionOpen: newStatus });
      if (res.data?.success) {
        toast.success(newStatus ? 'Admissions are now Open' : 'Admissions are now Closed');
      } else {
        throw new Error(res.data?.error || 'Failed to update setting');
      }
    } catch (err: any) {
      setAdmissionOpen(!newStatus); // Revert on failure
      toast.error(err.response?.data?.error || err.message || 'Failed to update admission status');
    } finally {
      setUpdatingToggle(false);
    }
  };

  const handleAcademicYearChange = async (newYear: string) => {
    if (updatingYear || newYear === academicYear) return;
    setUpdatingYear(true);
    const previousYear = academicYear;
    setAcademicYear(newYear); // Optimistic update

    try {
      const res = await API.put('/admin/settings', { academicYear: newYear, admissionCycle: newYear });
      if (res.data?.success) {
        toast.success(`Academic Year updated to ${newYear}`);
      } else {
        throw new Error(res.data?.error || 'Failed to update Academic Year');
      }
    } catch (err: any) {
      setAcademicYear(previousYear); // Revert
      toast.error(err.response?.data?.error || err.message || 'Failed to update Academic Year');
    } finally {
      setUpdatingYear(false);
    }
  };

  const handleClosingDateSave = async () => {
    if (updatingClosingDate) return;
    setUpdatingClosingDate(true);
    try {
      const res = await API.put('/admin/settings', { admissionClosingDate: closingDate });
      if (res.data?.success) {
        toast.success('Admission Closing Date & Time updated successfully');
      } else {
        throw new Error(res.data?.error || 'Failed to update Closing Date');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update Closing Date');
    } finally {
      setUpdatingClosingDate(false);
    }
  };

  const handleHandbookFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed for Admission Handbook.');
      return;
    }

    setUploadingHandbook(true);
    const formData = new FormData();
    formData.append('handbookPdf', file);

    try {
      const res = await API.post('/admin/settings/handbook', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setHandbookUrl(res.data.handbookUrl);
        toast.success('Admission Handbook PDF uploaded successfully');
      } else {
        throw new Error(res.data?.error || 'Failed to upload Handbook PDF');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to upload Handbook PDF');
    } finally {
      setUploadingHandbook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-medium text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure system-wide portal parameters, academic cycles, admission deadlines, handbooks, and access controls.
          </p>
        </div>
      </div>

      {/* Academic Year Control Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Academic Year</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set the active Academic Year dynamically used for new student admissions across the ERP portal.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Current Active Session</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {academicYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                Newly submitted applications will be automatically tagged with this Academic Year. Existing applications will permanently retain their original session.
              </p>
            </div>

            {/* Academic Year Selector Dropdown */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <label htmlFor="academicYearSelect" className="sr-only">Select Academic Year</label>
              <select
                id="academicYearSelect"
                value={academicYear}
                disabled={updatingYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
              >
                {ACADEMIC_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {updatingYear && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
            </div>
          </div>
        </div>
      </div>

      {/* Admission Closing Date & Time Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Admission Closing Date & Time</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single source of truth for the student portal application deadline.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white block">Closing Date & Time</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                Displayed dynamically on the Student Dashboard. When this date/time passes, admissions will automatically show as closed.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <input
                type="datetime-local"
                value={closingDate}
                disabled={updatingClosingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleClosingDateSave}
                disabled={updatingClosingDate}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-colors flex items-center gap-2"
              >
                {updatingClosingDate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admission Handbook PDF Upload Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Admission Handbook PDF Upload</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload or replace the official single PDF handbook available for student download.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white block">Active Handbook Status</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                {handbookUrl
                  ? 'Custom PDF handbook uploaded and active for student downloads.'
                  : 'Default built-in JCER Admission Handbook template active for student downloads.'}
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-colors flex items-center gap-2">
                {uploadingHandbook ? <Loader2 className="w-4 h-4 animate-spin" /> : (handbookUrl ? 'Replace PDF' : 'Upload PDF')}
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={uploadingHandbook}
                  onChange={handleHandbookFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Admission Control Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${admissionOpen ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
              {admissionOpen ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Admission Control</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage global availability for student registrations and new application submissions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Admission Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${admissionOpen ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'}`}>
                  {admissionOpen ? 'ON — Admissions Open' : 'OFF — Admissions Closed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                {admissionOpen
                  ? 'Students can freely register, create accounts, and submit new admission applications.'
                  : 'New student registrations and starting new applications are blocked.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={admissionOpen}
                disabled={updatingToggle}
                onClick={() => handleToggle(!admissionOpen)}
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  admissionOpen ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                } ${updatingToggle ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    admissionOpen ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemSettingsPage;
