import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { AdmissionApplication } from '../services/admission.service';

export interface ExportFilterMetadata {
  academicYear: string;
  branchName: string;
  branchCode: string;
  statusLabel: string;
  admissionType: string;
  qualification: string;
  gender: string;
  category: string;
  district: string;
  startDate: string;
  endDate: string;
  search: string;
  generatedBy?: string;
}

const STATUS_LABEL_MAP: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Verified (Admin)',
  REJECTED: 'Rejected',
  ENROLLED: 'Admission Confirmed',
  CANCELLATION_REQUESTED: 'Cancellation Pending',
  CANCELLED: 'Admission Cancelled',
};

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return 'N/A';
  }
}

function formatDocStatus(docUrl?: string | null): string {
  if (!docUrl) return 'Not Uploaded';
  return 'Uploaded';
}

// ─── Map Summary Data ────────────────────────────────────────────────────────
export function mapSummaryExportData(applications: AdmissionApplication[]) {
  return applications.map((app, index) => {
    const pd = app.studentpersonaldetails;
    const user = app.user;
    const branch = app.branch;

    return {
      'Sl No': index + 1,
      'Admission Number': app.applicationNumber || 'N/A',
      'Student Name': user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'N/A',
      'Gender': pd?.gender || 'N/A',
      'Mobile Number': pd?.phone || user?.phone || 'N/A',
      'Email': pd?.email || user?.email || 'N/A',
      'Branch': branch?.code || 'N/A',
      'Admission Type': app.admissionType || 'N/A',
      'Qualification': app.qualification || 'N/A',
      'Category': pd?.category || 'N/A',
      'Admission Status': STATUS_LABEL_MAP[app.applicationStatus] || app.applicationStatus || 'N/A',
      'Academic Year': app.academicYear || 'N/A',
      'Admission Date': formatDate(app.createdAt),
      'Approved Date': formatDate(app.reviewedAt || app.approvedByAdminAt),
      'Confirmation Date': formatDate(app.enrolledAt),
    };
  });
}

// ─── Map Complete Data (Sections A to F) ────────────────────────────────────
export function mapCompleteExportData(applications: AdmissionApplication[]) {
  return applications.map((app) => {
    const user = app.user;
    const pd = app.studentpersonaldetails;
    const parent = app.studentparentdetails;
    const addr = app.studentaddress;
    const acad = app.studentacademicdetails;
    const docs = app.studentdocuments;
    const branch = app.branch;

    return {
      // SECTION A: ADMISSION DETAILS
      'Admission Number': app.applicationNumber || 'N/A',
      'Academic Year': app.academicYear || 'N/A',
      'Branch': branch ? `${branch.name} (${branch.code})` : 'N/A',
      'Admission Type': app.admissionType || 'N/A',
      'Seat Category': pd?.category || 'N/A',
      'Admission Status': STATUS_LABEL_MAP[app.applicationStatus] || app.applicationStatus || 'N/A',
      'Admission Date': formatDate(app.createdAt),
      'Approval Date': formatDate(app.reviewedAt || app.approvedByAdminAt || app.verifiedAt),
      'Confirmation Date': formatDate(app.enrolledAt || app.feeVerifiedAt || app.updatedAt),

      // SECTION B: PERSONAL DETAILS
      'Student Name': user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'N/A',
      'Father Name': parent?.fatherName || 'N/A',
      'Mother Name': parent?.motherName || 'N/A',
      'Date of Birth': formatDate(pd?.dateOfBirth || pd?.dob),
      'Gender': pd?.gender || 'N/A',
      'Aadhaar Number': app.aadhaar || pd?.aadhaarNumber || 'N/A',
      'Blood Group': pd?.bloodGroup || 'N/A',
      'Religion': pd?.religion || 'N/A',
      'Category': pd?.category || 'N/A',
      'Nationality': pd?.nationality || 'Indian',
      'Marital Status': pd?.maritalStatus || 'Single',
      'Email': pd?.email || user?.email || 'N/A',
      'Mobile Number': pd?.phone || user?.phone || 'N/A',
      'Alternate Mobile Number': pd?.alternatePhone || parent?.fatherPhone || parent?.guardianPhone || 'N/A',

      // SECTION C: ADDRESS DETAILS
      'Permanent Address': addr ? `${addr.permanentAddress || addr.permanentAddressLine1 || ''}, ${addr.permanentCity || ''}`.replace(/^, |, $/g, '') : 'N/A',
      'Current Address': addr ? `${addr.currentAddress || addr.currentAddressLine1 || ''}, ${addr.currentCity || ''}`.replace(/^, |, $/g, '') : 'N/A',
      'Village': addr?.permanentCity || 'N/A',
      'Taluk': addr?.permanentTaluk || addr?.permanentCity || 'N/A',
      'District': addr?.permanentDistrict || addr?.permanentCity || addr?.currentCity || 'N/A',
      'State': addr?.permanentState || 'Karnataka',
      'PIN Code': addr?.permanentPincode || 'N/A',

      // SECTION D: ACADEMIC DETAILS
      'SSLC Board': acad?.tenthBoard || acad?.sslcBoard || 'N/A',
      'SSLC School': acad?.tenthSchool || acad?.sslcSchool || 'N/A',
      'SSLC Passing Year': acad?.tenthPassingYear || acad?.sslcYear || 'N/A',
      'SSLC Max Marks': acad?.tenthMaxMarks || 'N/A',
      'SSLC Obtained Marks': acad?.tenthMarksObtained || acad?.tenthObtainedMarks || 'N/A',
      'SSLC Percentage': acad?.tenthPercentage ? `${acad.tenthPercentage}%` : 'N/A',

      'PUC/Diploma Board': acad?.twelfthBoard || 'N/A',
      'PUC/Diploma College': acad?.twelfthCollege || acad?.twelfthSchool || 'N/A',
      'PUC/Diploma Stream': acad?.twelfthStream || 'N/A',
      'PUC/Diploma Passing Year': acad?.twelfthPassingYear || 'N/A',
      'PUC/Diploma Max Marks': acad?.twelfthMaxMarks || 'N/A',
      'PUC/Diploma Obtained Marks': acad?.twelfthObtainedMarks || 'N/A',
      'PUC/Diploma Percentage': acad?.twelfthPercentage ? `${acad.twelfthPercentage}%` : 'N/A',

      'Entrance Type': app.admissionType || 'N/A',
      'Entrance Number': app.cetNumber || app.dcetNumber || 'N/A',
      'Entrance Rank': acad?.entranceRank || acad?.cetRank || 'N/A',
      'Entrance Attempts': acad?.entranceAttempts || '1',

      // SECTION E: DOCUMENT STATUS
      'Passport Photo': formatDocStatus(docs?.photoUrl),
      'Signature': formatDocStatus(docs?.signatureUrl),
      'SSLC Marks Card': formatDocStatus(docs?.tenthMarksheetUrl),
      'PUC Marks Card': formatDocStatus(docs?.twelfthMarksheetUrl),
      'Diploma 5th Sem Marks Card': formatDocStatus(docs?.diplomaSemester5MarksheetUrl),
      'Diploma 6th Sem Marks Card': formatDocStatus(docs?.diplomaSemester6MarksheetUrl),
      'Entrance Score Card': formatDocStatus(docs?.cetScoreCardUrl),
      'Aadhaar Card': formatDocStatus(docs?.aadhaarUrl),
      'Income Certificate': formatDocStatus(docs?.casteCertificateUrl),
      'Study Certificate': formatDocStatus(docs?.domicileCertificateUrl),
      'Fee Receipt': formatDocStatus(docs?.feesPaidReceiptUrl),

      // SECTION F: ADMIN DETAILS
      'Verified By': app.reviewedBy || 'Nodal Verification Officer',
      'Principal Approval': app.approvedByAdminAt ? 'Approved' : (app.applicationStatus === 'ENROLLED' ? 'Approved' : 'Pending'),
      'Current Status': STATUS_LABEL_MAP[app.applicationStatus] || app.applicationStatus || 'N/A',
      'Remarks': app.adminRemarks || app.cancellationRemarks || 'N/A',
      'Created Date': formatDate(app.createdAt),
      'Updated Date': formatDate(app.updatedAt),
      'Last Modified By': app.reviewedBy || 'Administrator',
    };
  });
}

// ─── Export Handler Main Function ───────────────────────────────────────────
export function generateStudentReport(
  applications: AdmissionApplication[],
  type: 'summary' | 'complete',
  format: 'excel' | 'csv' | 'pdf',
  meta: ExportFilterMetadata
) {
  const isSummary = type === 'summary';
  const data = isSummary ? mapSummaryExportData(applications) : mapCompleteExportData(applications);

  const cleanYear = meta.academicYear.replace(/\s+/g, '');
  const cleanBranch = meta.branchCode || 'ALL';
  const dateStr = new Date().toISOString().split('T')[0];
  const reportPrefix = isSummary ? 'Students_Summary' : 'Students_Complete';
  const filenameBase = `${reportPrefix}_${cleanYear}_${cleanBranch}_${dateStr}`;

  if (format === 'excel') {
    exportToExcel(data, filenameBase, type, meta);
  } else if (format === 'csv') {
    exportToCSV(data, filenameBase);
  } else if (format === 'pdf') {
    exportToPDF(data, filenameBase, type, meta);
  }
}

// ─── Excel Exporter ──────────────────────────────────────────────────────────
function exportToExcel(
  data: Record<string, any>[],
  filenameBase: string,
  type: 'summary' | 'complete',
  meta: ExportFilterMetadata
) {
  const sheetName = type === 'summary' ? 'Summary Report' : 'Complete Report';

  // Build metadata header rows
  const metaRows = [
    ['JAIN COLLEGE OF ENGINEERING & RESEARCH'],
    [`Student Database Report (${type.toUpperCase()} REPORT)`],
    [`Academic Session: ${meta.academicYear} | Generated On: ${new Date().toLocaleString('en-IN')} | Total Records: ${data.length}`],
    [`Applied Filters: Branch=${meta.branchCode}, Status=${meta.statusLabel}, Type=${meta.admissionType}, Qual=${meta.qualification}`],
    [] // Blank row before table
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(metaRows);
  XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A6' });

  // Auto column widths
  const keys = Object.keys(data[0] || {});
  const colWidths = keys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const val = row[key] ? String(row[key]) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
}

// ─── CSV Exporter ────────────────────────────────────────────────────────────
function exportToCSV(data: Record<string, any>[], filenameBase: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenameBase}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── PDF Exporter ────────────────────────────────────────────────────────────
function exportToPDF(
  data: Record<string, any>[],
  filenameBase: string,
  type: 'summary' | 'complete',
  meta: ExportFilterMetadata
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('JAIN COLLEGE OF ENGINEERING & RESEARCH', 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student Database Report — ${type.toUpperCase()} REPORT`, 14, 16);

  doc.setFontSize(8);
  doc.text(`Session: ${meta.academicYear} | Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 10, { align: 'right' });
  doc.text(`Total Records: ${data.length}`, pageWidth - 14, 16, { align: 'right' });

  // Applied Filters Banner
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, 25, pageWidth - 28, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const filterText = `Filters: Year=${meta.academicYear} | Branch=${meta.branchCode} | Status=${meta.statusLabel} | Type=${meta.admissionType} | Search=${meta.search || 'None'}`;
  doc.text(filterText, 18, 30);

  // Table Setup
  const headers = type === 'summary' 
    ? ['Sl', 'Adm No', 'Student Name', 'Gen', 'Mobile', 'Email', 'Branch', 'Type', 'Qual', 'Category', 'Status', 'Adm Date']
    : ['Adm No', 'Student Name', 'Branch', 'Type', 'Status', 'Gender', 'Mobile', 'District', 'SSLC %', 'PUC %', 'Entrance No', 'Docs'];

  const startY = 37;

  // Simple clean table renderer
  const colWidths = type === 'summary' 
    ? [8, 30, 42, 10, 24, 45, 14, 14, 12, 16, 28, 22]
    : [28, 38, 14, 14, 26, 12, 24, 22, 14, 14, 24, 20];

  let currentY = startY;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(226, 232, 240);
  doc.rect(14, currentY, pageWidth - 28, 6, 'F');
  doc.setTextColor(30, 41, 59);

  let curX = 16;
  headers.forEach((h, i) => {
    doc.text(h, curX, currentY + 4.5);
    curX += colWidths[i];
  });

  currentY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  data.forEach((row, rIdx) => {
    if (currentY > pageHeight - 15) {
      doc.addPage('landscape');
      currentY = 15;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(226, 232, 240);
      doc.rect(14, currentY, pageWidth - 28, 6, 'F');
      curX = 16;
      headers.forEach((h, i) => {
        doc.text(h, curX, currentY + 4.5);
        curX += colWidths[i];
      });
      currentY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
    }

    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY - 1, pageWidth - 28, 5.5, 'F');
    }

    curX = 16;
    const values = type === 'summary' ? [
      String(row['Sl No']),
      String(row['Admission Number']),
      String(row['Student Name']).substring(0, 24),
      String(row['Gender']).substring(0, 4),
      String(row['Mobile Number']),
      String(row['Email']).substring(0, 26),
      String(row['Branch']),
      String(row['Admission Type']),
      String(row['Qualification']),
      String(row['Category']),
      String(row['Admission Status']).substring(0, 16),
      String(row['Admission Date'])
    ] : [
      String(row['Admission Number']),
      String(row['Student Name']).substring(0, 22),
      String(row['Branch']).substring(0, 10),
      String(row['Admission Type']),
      String(row['Admission Status']).substring(0, 15),
      String(row['Gender']).substring(0, 4),
      String(row['Mobile Number']),
      String(row['District']).substring(0, 12),
      String(row['SSLC Percentage']),
      String(row['PUC/Diploma Percentage']),
      String(row['Entrance Number']).substring(0, 14),
      String(row['Aadhaar Card'])
    ];

    values.forEach((v, i) => {
      doc.text(v, curX, currentY + 3.5);
      curX += colWidths[i];
    });

    currentY += 5.5;
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
    doc.text('Generated from JCER ERP | Confidential | For Office Use Only', 14, pageHeight - 5);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  }

  doc.save(`${filenameBase}.pdf`);
}
