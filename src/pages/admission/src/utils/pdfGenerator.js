import { getAcademicYear } from '../../../../utils/date.util';

/**
 * Shared PDF/Print generator for student admission application acknowledgment forms.
 * Opens the browser print window with the formatted A4 HTML template.
 */
export const downloadAdmissionPDF = async (api, toast, applicationId = null) => {
    const toastId = toast.loading('Preparing your admission document…');
    try {
        // Fetch full application details
        const url = applicationId ? `/admin/admissions/${applicationId}` : '/application/full-details';
        const res = await api.get(url);
        if (!res.data.success) throw new Error('Failed to load details');
        const details = res.data.data;

        const pd = details?.studentpersonaldetails || {};
        const par = details?.studentparentdetails || {};
        const addr = details?.studentaddress || {};
        const acad = details?.studentacademicdetails || {};
        const docs = details?.studentdocuments || {};
        const branch = details?.branch || {};
        const user = details?.user || {};
        const q = (details?.qualification || '').toUpperCase();
        const showPUC = q === 'PUC' || (!q && details?.admissionType === 'KCET');
        const showDiploma = q === 'DIPLOMA' || (!q && details?.admissionType === 'DCET');

        const applicantName = pd.firstName
            ? `${pd.firstName} ${pd.lastName || ''}`.trim()
            : `${user.firstName || ''} ${user.lastName || ''}`.trim();

        const apiBaseUrl = import.meta.env.VITE_API_URL || '';
        const backendBase = apiBaseUrl.replace('/api', '');

        const absoluteLogoUrl = new URL('/logo.png', window.location.origin).href;
        const getDocUrl = (path) => {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            const normalizedPath = path.startsWith('/') ? path : '/' + path;
            return `${backendBase}${normalizedPath}`;
        };
        const photoUrl = docs.photoUrl ? getDocUrl(docs.photoUrl) : '';
        const signatureUrl = docs.signatureUrl ? getDocUrl(docs.signatureUrl) : '';
        const logoUrl = absoluteLogoUrl;

        console.log({
            logoUrl,
            photoUrl,
            signatureUrl
        });

        const preloadImage = (url) => {
            return new Promise((resolve) => {
                if (!url) {
                    resolve(false);
                    return;
                }
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });
        };

        let logoLoaded = false;
        let photoLoaded = false;
        let signatureLoaded = false;

        await Promise.all([
            preloadImage(logoUrl).then(res => logoLoaded = res),
            preloadImage(photoUrl).then(res => photoLoaded = res),
            preloadImage(signatureUrl).then(res => signatureLoaded = res)
        ]);

        const getPdfStatusText = (det) => {
            const status = det?.applicationStatus;
            if (status === 'ENROLLED') return 'ADMISSION CONFIRMED';
            if (status === 'APPROVED') return 'ADMISSION APPROVED';
            if (det?.documentsVerified) return 'DOCUMENTS VERIFIED';
            if (status === 'UNDER_REVIEW') return 'UNDER REVIEW';
            if (status === 'SUBMITTED') {
                if (det?.resubmittedAt) return 'APPLICATION RESUBMITTED';
                return 'APPLICATION SUBMITTED';
            }
            if (status === 'REJECTED') return 'APPLICATION REJECTED';
            return 'APPLICATION DRAFT';
        };
        const pdfStatus = getPdfStatusText(details);

        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Confirmed Admission – ${details?.applicationNumber || ''}</title>
                <style>
                    @page { size: A4 portrait; margin: 10mm 15mm; }
                    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    html, body { height: auto !important; overflow: visible !important; }
                    body { font-family: 'Times New Roman', Times, serif; background: white; margin: 0; padding: 0; color: #000; }
                    .application-form { width: 100%; max-width: 180mm; margin: 0 auto; padding: 10px; background: white; box-sizing: border-box; height: auto !important; overflow: visible !important; }
                    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; opacity: 0.07; pointer-events: none; z-index: 0; }
                    .watermark img { width: 100%; height: 100%; object-fit: contain; }
                    /* CONFIRMED STAMP */
                    .confirmed-stamp {
                        position: fixed; top: 35%; right: 4%; transform: rotate(-20deg);
                        border: 4px solid #16a34a; color: #16a34a; font-size: 22pt; font-weight: 900;
                        padding: 6px 14px; opacity: 0.18; pointer-events: none; z-index: 1;
                        letter-spacing: 2px; font-family: Arial, sans-serif;
                    }
                    @media print {
                        html, body, .application-form {
                            height: auto !important;
                            overflow: visible !important;
                        }
                        .watermark, .confirmed-stamp { position: fixed; }
                    }
                    .header { border-bottom: 3px solid #1a3c6e; padding-bottom: 12px; margin-bottom: 15px; }
                    .header-top { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; }
                    .logo-box { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
                    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
                    .header-text { flex: 1; text-align: center; padding: 0 10px; }
                    .header-text h1 { font-size: 14pt; font-weight: bold; color: #1a3c6e; }
                    .header-text h2 { font-size: 11pt; font-weight: bold; color: #1a3c6e; border: 1.5px solid #1a3c6e; display: inline-block; padding: 1px 12px; margin: 4px 0; }
                    .header-text p { font-size: 9.5pt; color: #333; margin: 2px 0 0; }
                    .photo-box { flex-shrink: 0; width: 80px; height: 100px; border: 2px solid #1a3c6e; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fafafa; }
                    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
                    .photo-placeholder { font-size: 10px; color: #999; text-align: center; }
                    .header-bottom { display: flex; justify-content: space-between; margin-top: 10px; padding: 6px 12px; background: #f5f7fa; border: 1px solid #dde1e8; font-size: 10pt; }
                    .status-confirmed { background: #dcfce7; border: 2px solid #16a34a; padding: 8px 14px; margin: 10px 0 14px; text-align: center; font-size: 12pt; font-weight: bold; color: #15803d; letter-spacing: 1px; }
                    .notice-box { background: #fffbeb; border: 1.5px solid #d97706; padding: 8px 14px; margin-bottom: 12px; font-size: 9.5pt; color: #92400e; }
                    .body { margin: 10px 0 15px; }
                    .section { margin-bottom: 12px; }
                    .section-title { background: #000; color: white; padding: 5px 12px; font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; }
                    .section-content { border: 1px solid #dde1e8; border-top: none; }
                    .section-content table { width: 100%; border-collapse: collapse; }
                    .section-content td { padding: 4px 10px; border-bottom: 1px dotted #e0e4eb; font-size: 10pt; }
                    .section-content tr:last-child td { border-bottom: none; }
                    .label { width: 160px; font-weight: 600; color: #333; }
                    .value { font-weight: 500; color: #000; }
                    .subheader { background: #f5f7fa; font-weight: bold; color: #1a3c6e; padding: 3px 10px !important; }
                    .declaration { margin: 15px 0 12px; border: 2px solid #1a3c6e; padding: 10px 14px; background: #f8faff; }
                    .declaration-title { font-size: 11pt; font-weight: bold; color: #1a3c6e; text-align: center; margin-bottom: 4px; }
                    .declaration-text { font-size: 10pt; line-height: 1.5; text-align: justify; }
                    .signature { display: flex; justify-content: space-between; margin: 25px 0 10px; padding: 0 20px; }
                    .signature-item { text-align: center; width: 200px; }
                    .signature-line { border-top: 1px solid black; height: 25px; margin-bottom: 3px; }
                    .signature-img { height: 35px; object-fit: contain; display: block; margin: 0 auto 3px; }
                    .signature-label { font-size: 9pt; color: #333; font-weight: 600; }
                    .footer { margin-top: 20px; border-top: 2px solid #1a3c6e; padding-top: 10px; text-align: center; }
                    .footer p { font-size: 9pt; color: #555; margin: 2px 0; }
                </style>
            </head>
            <body>
                <div class="watermark">${logoLoaded ? `<img src="${logoUrl}" alt="" />` : ''}</div>
                <div class="application-form">
                    <div class="header">
                        <div class="header-top">
                            <div class="logo-box">${logoLoaded ? `<img src="${logoUrl}" alt="JCER Logo" />` : `<span style="font-size:8px;">Logo Not Loaded</span>`}</div>
                            <div class="header-text">
                                <h1>JAIN COLLEGE OF ENGINEERING AND RESEARCH</h1>
                                <p style="font-size:8px;color:#475569;">(Approved by AICTE, New Delhi, Affiliated to VTU Belagavi &amp; Recognized by Govt. of Karnataka)</p>
                                <h2>ADMISSION APPLICATION FORM</h2>
                                <p>Academic Session ${details?.academicYear || getAcademicYear()}</p>
                            </div>
                            <div class="photo-box">
                                ${photoUrl ? (photoLoaded ? `<img src="${photoUrl}" alt="Passport Photo" />` : `<span class="photo-placeholder" style="color:red;">Passport Photo<br>Not Available</span>`) : `<span class="photo-placeholder">PASSPORT<br>PHOTO</span>`}
                            </div>
                        </div>
                        <div class="header-bottom">
                            <span><strong>Admission No:</strong> ${details?.applicationNumber || 'N/A'}</span>
                            <span><strong>Status:</strong> ${pdfStatus}</span>
                            <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>

                    ${details?.applicationStatus === 'REJECTED' ? `
                    <div class="status-confirmed" style="background: #fef2f2; border: 2px solid #ef4444; color: #b91c1c;">❌ ${pdfStatus} </div>
                    <div class="notice-box" style="background: #fff5f5; border: 1.5px solid #f87171; color: #991b1b; padding: 12px 16px;">
                        <strong>Correction / Rejection Reason:</strong>
                        <p style="margin-top: 4px; font-style: italic; white-space: pre-line;">
                            ${(() => {
                                const isOther = details.rejectionReasonCode === 'OTHER' || details.rejectionReason === 'Other' || details.rejectionReason === 'OTHER';
                                if (isOther) {
                                    return details.adminRemarks || details.rejectionReason || 'Other';
                                }
                                return details.rejectionReason || details.adminRemarks || '';
                            })()}
                        </p>
                    </div>
                    ` : `
                    <div class="status-confirmed">✅ ${pdfStatus} </div>
                    <div class="notice-box">📋 <strong>Important:</strong> Please carry this printed copy when visiting the college for document verification and enrollment formalities.</div>
                    `}

                    <div class="body">
                        <div class="section">
                            <div class="section-title">1. COURSE PREFERENCE</div>
                            <div class="section-content">
                                <table><tbody>
                                    <tr><td class="label">Admission Type</td><td class="value">${details?.admissionType || '—'}</td></tr>
                                    <tr><td class="label">Preferred Branch</td><td class="value">${branch?.name ? `${branch.name} (${branch.code || ''})` : '—'}</td></tr>
                                    ${details?.cetNumber ? `<tr><td class="label">CET Number</td><td class="value">${details.cetNumber}</td></tr>` : ''}
                                    ${details?.dcetNumber ? `<tr><td class="label">DCET Number</td><td class="value">${details.dcetNumber}</td></tr>` : ''}
                                </tbody></table>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">2. PERSONAL DETAILS</div>
                            <div class="section-content">
                                <table><tbody>
                                    <tr><td class="label">Full Name</td><td class="value">${applicantName || '—'}</td></tr>
                                    <tr><td class="label">Date of Birth</td><td class="value">${pd.dateOfBirth || '—'}</td></tr>
                                    <tr><td class="label">Gender</td><td class="value">${pd.gender || '—'}</td></tr>
                                    <tr><td class="label">Category</td><td class="value">${pd.category || '—'}</td></tr>
                                    <tr><td class="label">Religion</td><td class="value">${pd.religion || '—'}</td></tr>
                                    <tr><td class="label">Nationality</td><td class="value">${pd.nationality || '—'}</td></tr>
                                    <tr><td class="label">Mobile</td><td class="value">${pd.phone || user.phone || '—'}</td></tr>
                                    <tr><td class="label">Email</td><td class="value">${user.email || '—'}</td></tr>
                                </tbody></table>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">3. PARENT / GUARDIAN DETAILS</div>
                            <div class="section-content">
                                <table><tbody>
                                    <tr><td class="label">Father's Name</td><td class="value">${par.fatherName || '—'}</td></tr>
                                    <tr><td class="label">Father's Occupation</td><td class="value">${par.fatherOccupation || '—'}</td></tr>
                                    <tr><td class="label">Father's Mobile</td><td class="value">${par.fatherPhone || '—'}</td></tr>
                                    <tr><td class="label">Mother's Name</td><td class="value">${par.motherName || '—'}</td></tr>
                                    <tr><td class="label">Mother's Mobile</td><td class="value">${par.motherPhone || '—'}</td></tr>
                                    <tr><td class="label">Annual Income</td><td class="value">${par.fatherAnnualIncome ? `₹${Number(par.fatherAnnualIncome).toLocaleString('en-IN')}` : '—'}</td></tr>
                                </tbody></table>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">4. ADDRESS</div>
                            <div class="section-content">
                                <table><tbody>
                                    <tr><td colspan="2" class="subheader">Current Address</td></tr>
                                    <tr><td class="label">Address</td><td class="value">${addr.currentAddressLine1 || '—'}</td></tr>
                                    <tr><td class="label">City / State / Pin</td><td class="value">${[addr.currentCity, addr.currentState, addr.currentPincode].filter(Boolean).join(', ') || '—'}</td></tr>
                                </tbody></table>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">5. ACADEMIC RECORD</div>
                            <div class="section-content">
                                <table><tbody>
                                    <tr><td colspan="2" class="subheader">SSLC / 10th</td></tr>
                                    <tr><td class="label">Board</td><td class="value">${acad.tenthBoard || '—'}</td></tr>
                                    <tr><td class="label">Year</td><td class="value">${acad.tenthPassingYear || '—'}</td></tr>
                                    <tr><td class="label">Percentage</td><td class="value">${acad.tenthPercentage ? `${acad.tenthPercentage}%` : '—'}</td></tr>
                                    ${showPUC ? `
                                    <tr><td colspan="2" class="subheader">PUC / 12th</td></tr>
                                    <tr><td class="label">Board</td><td class="value">${acad.twelfthBoard || '—'}</td></tr>
                                    <tr><td class="label">Year</td><td class="value">${acad.twelfthPassingYear || '—'}</td></tr>
                                    <tr><td class="label">Percentage</td><td class="value">${acad.twelfthPercentage ? `${acad.twelfthPercentage}%` : '—'}</td></tr>
                                    ` : ''}
                                    ${showDiploma ? `
                                    <tr><td colspan="2" class="subheader">Diploma details (Lateral Entry)</td></tr>
                                    <tr><td class="label">University</td><td class="value">${acad.diplomaUniversity || '—'}</td></tr>
                                    <tr><td class="label">Year</td><td class="value">${acad.diplomaYear || '—'}</td></tr>
                                    <tr><td class="label">Percentage</td><td class="value">${acad.diplomaPercentage ? `${acad.diplomaPercentage}%` : '—'}</td></tr>
                                    ` : ''}
                                </tbody></table>
                            </div>
                        </div>
                    </div>

                    <div class="declaration">
                        <div class="declaration-title">DECLARATION</div>
                        <div class="declaration-text">I hereby declare that the information furnished above is true, complete and correct to the best of my knowledge and belief.</div>
                    </div>

                    <div class="signature">
                        <div class="signature-item">
                            <div class="signature-line"></div>
                            <div class="signature-label">Date &amp; Place</div>
                        </div>
                        <div class="signature-item">
                            ${signatureUrl ? (signatureLoaded ? `<img class="signature-img" src="${signatureUrl}" alt="Signature" />` : `<span style="font-size: 9px; color: red; display: block; margin-bottom: 10px;">Signature Not Loaded</span>`) : `<span style="font-size: 9px; color: #999; display: block; margin-bottom: 10px;">Signature Not Uploaded</span>`}
                            <div class="signature-line"></div>
                            <div class="signature-label">Applicant Signature</div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Admission No: ${details?.applicationNumber || 'N/A'} &nbsp;|&nbsp; Status: ${pdfStatus} &nbsp;|&nbsp; Printed on: ${new Date().toLocaleString('en-IN')}</p>
                        <div style="border-top:1px solid #dde1e8;margin:5px 0;"></div>
                        <p>Contact: 099448693987 | principal@jcer.in</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        toast.dismiss(toastId);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printHTML);
            printWindow.document.close();

            const printImages = Array.from(printWindow.document.images);
            const imagePromises = printImages.map((img) => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        resolve();
                        return;
                    }
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
            });

            Promise.all(imagePromises).then(() => {
                printWindow.focus();
                printWindow.print();
            });
        } else {
            toast.error('Please allow popups to download the admission PDF.');
        }
    } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error('Failed to generate admission PDF: ' + (error.response?.data?.message || error.message));
    }
};
