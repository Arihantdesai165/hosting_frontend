import API from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdmissionStatus =
  | 'REGISTERED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'FEE_RECEIPT_UPLOADED'
  | 'FEE_VERIFIED'
  | 'REJECTED'
  | 'ENROLLED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  admissionType: string | null;
  qualification: string | null;
  aadhaar?: string;
  cetNumber?: string;
  dcetNumber?: string;
  applicationStatus: AdmissionStatus;
  documentsVerified?: boolean;
  feesVerified?: boolean;
  eligibilityVerified?: boolean;
  verificationRemarks?: string;
  adminRemarks?: string;
  rejectionReason?: string;
  rejectionReasonCode?: string;
  reviewedBy?: string;
  submittedAt: string | null;
  resubmittedAt?: string | null;
  reviewedAt: string | null;
  approvedByAdminId?: string | null;
  approvedByAdminAt?: string | null;
  approvalRemarks?: string | null;
  feeReceiptUploadedAt?: string | null;
  admissionFeeReceiptUrl?: string | null;
  feeVerifiedByAdminId?: string | null;
  feeVerifiedAt?: string | null;
  feeVerificationRemarks?: string | null;
  feeRejectionReason?: string | null;
  enrolledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string | null;
  correctionRequestedSections?: string[] | null;
  correctionDeadline?: string | null;
  correctionRequestedAt?: string | null;
  correctionRequestedById?: string | null;
  academicYear?: string | null;
  cancellationReason?: string | null;
  cancellationRemarks?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationRequestedById?: string | null;
  cancellationApprovedAt?: string | null;
  cancellationApprovedById?: string | null;
  cancellationRejectedAt?: string | null;
  cancellationRejectedById?: string | null;
  cancellationAdminRemarks?: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    profileImage: string | null;
    student?: {
      enrollmentNumber: string;
    } | null;
  } | null;
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
  studentpersonaldetails: {
    firstName: string;
    lastName: string;
    middleName: string | null;
    dateOfBirth: string | null;
    dob?: string | null;
    gender: string | null;
    category: string | null;
    religion: string | null;
    phone: string | null;
    email: string | null;
    nationality: string | null;
    caste?: string | null;
    studiedInKarnataka?: boolean | null;
    areaType?: string | null;
    aadhaarNumber?: string | null;
    bloodGroup?: string | null;
    maritalStatus?: string | null;
    alternatePhone?: string | null;
  } | null;
  studentparentdetails: {
    fatherName: string | null;
    fatherOccupation: string | null;
    fatherPhone: string | null;
    fatherEmail: string | null;
    fatherAnnualIncome: number | null;
    motherName: string | null;
    motherOccupation: string | null;
    motherPhone: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    parentPhone?: string | null;
  } | null;
  studentaddress: {
    currentAddressLine1: string | null;
    currentAddressLine2: string | null;
    currentCity: string | null;
    currentState: string | null;
    currentPincode: string | null;
    sameAsCurrent: boolean;
    permanentAddressLine1: string | null;
    permanentCity: string | null;
    permanentState: string | null;
    permanentPincode: string | null;
    permanentAddress?: string | null;
    currentAddress?: string | null;
    permanentDistrict?: string | null;
    currentDistrict?: string | null;
    permanentTaluk?: string | null;
  } | null;
  studentacademicdetails: {
    tenthSchool: string | null;
    tenthBoard: string | null;
    tenthPassingYear: number | null;
    tenthPercentage: number | null;
    tenthRegisterNumber?: string | null;
    tenthMarksObtained?: number | null;
    tenthObtainedMarks?: number | null;
    tenthMaxMarks?: number | null;
    tenthAttempts?: number | null;
    sslcBoard?: string | null;
    sslcSchool?: string | null;
    sslcYear?: number | null;
    twelfthSchool: string | null;
    twelfthCollege?: string | null;
    twelfthBoard: string | null;
    twelfthPassingYear: number | null;
    twelfthPercentage: number | null;
    twelfthStream: string | null;
    twelfthRegisterNumber?: string | null;
    twelfthMaxMarks?: number | null;
    twelfthObtainedMarks?: number | null;
    twelfthAttempts?: number | null;
    physicsMarks?: number | null;
    mathsMarks?: number | null;
    chemistryMarks?: number | null;
    optionalSubject?: string | null;
    optionalMarks?: number | null;
    diplomaUniversity?: string | null;
    diplomaYear?: string | null;
    diplomaRegisterNumber?: string | null;
    diplomaFinalYearMaxMarks?: number | null;
    diplomaFinalYearObtained?: number | null;
    diplomaPercentage?: number | null;
    diplomaAttempts?: number | null;
    cetScore: number | null;
    cetRank: number | null;
    cetYear: number | null;
    entranceRank?: number | null;
    entranceAttempts?: number | null;
    hasGap: boolean;
    gapReason: string | null;
  } | null;
  studentdocuments: {
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
    admissionFeeReceiptUrl?: string | null;
  } | null;
}

export interface AdmissionListResult {
  total: number;
  page: number;
  totalPages: number;
  applications: AdmissionApplication[];
}

export interface AdmissionStats {
  total: number;
  registered: number;
  draft?: number;
  submitted: number;
  resubmitted?: number;
  underReview: number;
  approved: number;
  rejected: number;
  enrolled: number;
  cancellationRequests?: number;
  feeReceiptUploaded?: number;
  feeVerified?: number;
  recent: AdmissionApplication[];
}

// ─── Admin Admission Service ──────────────────────────────────────────────────

const admissionService = {
  /** GET /api/admin/admissions — paginated list with optional filters */
  async listApplications(params: {
    status?: string;
    branchId?: string;
    admissionType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    qualification?: string;
    gender?: string;
    category?: string;
    district?: string;
    academicYear?: string;
    startDate?: string;
    endDate?: string;
    includeFullDetails?: boolean;
  }): Promise<AdmissionListResult> {
    const query = new URLSearchParams();
    if (params.page)     query.set('page',     String(params.page));
    if (params.limit)    query.set('limit',    String(params.limit));
    if (params.status)   query.set('status',   params.status);
    if (params.search)   query.set('search',   params.search);
    if (params.branchId) query.set('branchId', params.branchId);
    if (params.admissionType) query.set('admissionType', params.admissionType);
    if (params.sortBy)    query.set('sortBy',    params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.qualification) query.set('qualification', params.qualification);
    if (params.gender) query.set('gender', params.gender);
    if (params.category) query.set('category', params.category);
    if (params.district) query.set('district', params.district);
    if (params.academicYear) query.set('academicYear', params.academicYear);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.includeFullDetails) query.set('includeFullDetails', 'true');

    const res = await API.get(`/admin/admissions?${query.toString()}`);
    const data = res.data.data;
    if (Array.isArray(data)) {
      return {
        applications: data,
        total: res.data.total || 0,
        page: params.page || 1,
        totalPages: Math.ceil((res.data.total || 0) / (params.limit || 20))
      } as AdmissionListResult;
    }
    return data as AdmissionListResult;
  },

  /** GET /api/admin/admissions/:id — full application detail */
  async getApplication(id: string): Promise<AdmissionApplication> {
    const res = await API.get(`/admin/admissions/${id}`);
    return res.data.data as AdmissionApplication;
  },

  updateStatus: async (
    id: string,
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ENROLLED' | 'CORRECTION_REQUIRED',
    remarks?: string,
    rejectionReason?: string,
    rejectionReasonCode?: string,
    sections?: string[],
    deadline?: string
  ): Promise<void> => {
    await API.put(`/admin/admissions/${id}/status`, { status, remarks, rejectionReason, rejectionReasonCode, sections, deadline });
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },

  /** PUT /api/admin/admissions/:id/verify */
  verifyChecklist: async (id: string, payload: { documentsVerified?: boolean, feesVerified?: boolean, eligibilityVerified?: boolean, verificationRemarks?: string }): Promise<void> => {
    await API.put(`/admin/admissions/${id}/verify`, payload);
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },

  /** POST /api/admin/admissions/:id/fee-verify */
  verifyFeeReceipt: async (id: string, payload: { approve: boolean; remarks?: string; rejectionReason?: string }): Promise<void> => {
    await API.post(`/admin/admissions/${id}/fee-verify`, payload);
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },

  /** POST /api/student/upload-fee-receipt */
  uploadFeeReceipt: async (formData: FormData): Promise<void> => {
    await API.post('/student/upload-fee-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },

  /** GET /api/admin/stats — dashboard stats + recent applications */
  async getStats(): Promise<AdmissionStats> {
    const res = await API.get('/admin/stats');
    return res.data.data as AdmissionStats;
  },

  /** GET /api/branches */
  async getBranches(): Promise<{ id: string; name: string; code: string }[]> {
    const res = await API.get('/branches');
    return res.data.data;
  },

  requestCancellation: async (reason: string, remarks?: string): Promise<void> => {
    await API.post('/student/cancellation-request', { reason, remarks });
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },

  processCancellation: async (id: string, action: 'APPROVE' | 'REJECT', remarks?: string): Promise<void> => {
    await API.post(`/admin/admissions/${id}/cancellation-process`, { action, remarks });
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },

  directCancel: async (id: string, reason: string, remarks?: string): Promise<void> => {
    await API.post(`/admin/admissions/${id}/cancellation-direct`, { reason, remarks });
    window.dispatchEvent(new CustomEvent('admissions-updated'));
  },
};

export default admissionService;
