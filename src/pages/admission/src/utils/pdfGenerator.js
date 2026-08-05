import { getAcademicYear } from '../../../../utils/date.util';
import { buildFileUrl } from '../../../../utils/file.utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Shared PDF generator for student admission application acknowledgment forms.
 * Generates and downloads a clean, multi-page PDF using html2canvas and jsPDF.
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
        const acad = details?.studentacademicdetails || details?.academicDetails || details?.academic || {};
        const docs = details?.studentdocuments || details?.documents || {};
        const branch = details?.branch || {};
        const user = details?.user || {};
        const q = (details?.qualification || '').toUpperCase();
        const showPUC = q === 'PUC' || (!q && details?.admissionType === 'KCET');
        const showDiploma = q === 'DIPLOMA' || (!q && details?.admissionType === 'DCET');

        const applicantName = pd.firstName
            ? `${pd.firstName} ${pd.lastName || ''}`.trim()
            : `${user.firstName || ''} ${user.lastName || ''}`.trim();

        const absoluteLogoUrl = new URL('/logo.png', window.location.origin).href;
        
        const signatureUrl = docs.signatureUrl ? buildFileUrl(docs.signatureUrl) : '';
        const logoUrl = absoluteLogoUrl;

        // Trace data flow logs
        console.log("Application:", details);
        console.log("Personal:", pd);
        console.log("Parent:", par);
        console.log("Address:", addr);
        console.log("Academic:", acad);
        console.log("Documents:", docs);

        const isImageUrl = (url) => {
            if (!url) return false;
            const cleanUrl = url.split('?')[0].toLowerCase();
            return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
        };

        const documentList = [
            { label: '10th / SSLC Marks Card', url: docs.tenthMarksheetUrl ? buildFileUrl(docs.tenthMarksheetUrl) : '' },
            { label: '12th / PUC Marks Card', url: docs.twelfthMarksheetUrl ? buildFileUrl(docs.twelfthMarksheetUrl) : '' },
            { label: 'Diploma 5th Sem Marks Card', url: docs.diplomaSemester5MarksheetUrl ? buildFileUrl(docs.diplomaSemester5MarksheetUrl) : '' },
            { label: 'Diploma 6th Sem Marks Card', url: docs.diplomaSemester6MarksheetUrl ? buildFileUrl(docs.diplomaSemester6MarksheetUrl) : '' },
            { label: 'CET Score Card', url: docs.cetScoreCardUrl ? buildFileUrl(docs.cetScoreCardUrl) : '' },
            { label: 'Aadhaar Card', url: docs.aadhaarUrl ? buildFileUrl(docs.aadhaarUrl) : '' },
            { label: 'Caste Certificate', url: docs.casteCertificateUrl ? buildFileUrl(docs.casteCertificateUrl) : '' },
            { label: 'Domicile Certificate', url: docs.domicileCertificateUrl ? buildFileUrl(docs.domicileCertificateUrl) : '' },
            { label: 'Gap Certificate', url: docs.gapCertificateUrl ? buildFileUrl(docs.gapCertificateUrl) : '' }
        ];

        const imageDocs = documentList.filter(d => d.url && isImageUrl(d.url));

        // Helper to fetch and convert images to Base64 to bypass CORS and canvas taints
        const fetchImageAsBase64 = async (name, dbPath, resolvedUrl) => {
            console.log(`[Base64 Debug] Starting conversion for ${name}:`);
            console.log(`- Original database path: ${dbPath}`);
            console.log(`- buildFileUrl() output: ${resolvedUrl}`);
            
            if (!resolvedUrl) {
                console.log(`- Final Base64 string length: 0 (No URL resolved)`);
                return '';
            }
            if (resolvedUrl.startsWith('data:')) {
                console.log(`- Final Base64 string length: ${resolvedUrl.length} (Already base64)`);
                return resolvedUrl;
            }
            
            try {
                const response = await api.get(resolvedUrl, {
                    baseURL: '',
                    responseType: 'blob'
                });
                
                const blob = response.data;
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('FileReader failed'));
                    reader.readAsDataURL(blob);
                });
                
                console.log(`- Final Base64 string length: ${base64?.length || 0}`);
                console.log(`- Final img.src inserted into HTML: ${base64?.substring(0, 100)}...`);
                return base64;
            } catch (err) {
                console.error(`- Base64 conversion failed for ${name} via API. Error:`, err);
                if (err.response) {
                    console.error(`  Axios Error Status: ${err.response.status}`);
                    console.error(`  Axios Error Data:`, err.response.data);
                }
                
                // Fallback to native fetch
                try {
                    console.log(`- Falling back to native fetch for ${name} from: ${resolvedUrl}`);
                    const res = await fetch(resolvedUrl);
                    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                    const blob = await res.blob();
                    
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error('FileReader failed'));
                        reader.readAsDataURL(blob);
                    });
                    
                    console.log(`- Final Base64 string length (fallback): ${base64?.length || 0}`);
                    return base64;
                } catch (fetchErr) {
                    console.error(`- Native fetch fallback also failed for ${name}. Exception:`, fetchErr);
                    return '';
                }
            }
        };

        // Fetch all images as Base64 data urls
        const logoBase64 = await fetchImageAsBase64("Logo", "/logo.png", logoUrl);
        const signatureBase64 = await fetchImageAsBase64("Signature", docs.signatureUrl, signatureUrl);

        const resolvedImageDocs = [];
        for (const d of imageDocs) {
            const matchingDocKey = Object.keys(docs).find(k => docs[k] && buildFileUrl(docs[k]) === d.url);
            const originalPath = matchingDocKey ? docs[matchingDocKey] : d.url;
            
            const base64 = await fetchImageAsBase64(d.label, originalPath, d.url);
            if (base64) {
                resolvedImageDocs.push({ label: d.label, base64 });
            }
        }

        // Programmatically load and decode images before appending to DOM
        const createImageElement = async (base64, alt, className = '', style = {}) => {
            if (!base64) {
                console.log(`[Image Element Debug] ${alt} base64 is empty`);
                return null;
            }
            const img = new Image();
            img.alt = alt || '';
            img.className = className;
            Object.assign(img.style, style);
            img.src = base64;
            
            console.log(`[Image Element Debug] Created image element for ${alt}:`);
            console.log(`- Src length: ${img.src.length}`);
            console.log(`- Initial Complete: ${img.complete}`);
            
            try {
                await img.decode();
                console.log(`- Decoded: True`);
                console.log(`- Complete after decode: ${img.complete}`);
                console.log(`- NaturalWidth: ${img.naturalWidth}`);
                console.log(`- NaturalHeight: ${img.naturalHeight}`);
                
                if (img.naturalWidth === 0) {
                    console.error(`[Image Element Debug] WARNING: ${alt} naturalWidth is 0 after decode!`);
                }
                return img;
            } catch (err) {
                console.error(`- Decoded: False (Exception: ${err.message})`);
                console.error(`- Complete after decode: ${img.complete}`);
                console.error(`- NaturalWidth: ${img.naturalWidth}`);
                console.error(`- NaturalHeight: ${img.naturalHeight}`);
                return null;
            }
        };

        const watermarkImg = logoBase64 ? await createImageElement(logoBase64, "Watermark") : null;
        const logoImg = logoBase64 ? await createImageElement(logoBase64, "Logo") : null;
        const signatureImg = signatureBase64 ? await createImageElement(signatureBase64, "Signature") : null;

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

        // Offscreen Container setup (Fixed coordinates so html2canvas doesn't clip)
        const wrapper = document.createElement('div');
        wrapper.id = 'pdf-rendering-wrapper';
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = '190mm';
        wrapper.style.zIndex = '-9999';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.background = '#ffffff';

        const commonStyle = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Times New Roman', Times, serif; background: white; color: #000; }
                .application-form { width: 190mm; min-height: 277mm; padding: 10mm 15mm; background: white; position: relative; box-sizing: border-box; }
                .watermark { position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%); width: 350px; height: 350px; opacity: 0.07; pointer-events: none; z-index: 0; }
                .watermark img { width: 100%; height: 100%; object-fit: contain; }
                .confirmed-stamp {
                    position: absolute; top: 35%; right: 4%; transform: rotate(-20deg);
                    border: 4px solid #16a34a; color: #16a34a; font-size: 22pt; font-weight: 900;
                    padding: 6px 14px; opacity: 0.18; pointer-events: none; z-index: 1;
                    letter-spacing: 2px; font-family: Arial, sans-serif;
                }
                .header { border-bottom: 3px solid #1a3c6e; padding-bottom: 12px; margin-bottom: 15px; }
                .header-top { display: grid; grid-template-columns: 80px 1fr; align-items: center; }
                .logo-box { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
                .logo-box img { width: 100%; height: 100%; object-fit: contain; }
                .header-text { flex: 1; text-align: center; padding: 0 10px; }
                .header-text h1 { font-size: 14pt; font-weight: bold; color: #1a3c6e; }
                .header-text h2 { font-size: 11pt; font-weight: bold; color: #1a3c6e; border: 1.5px solid #1a3c6e; display: inline-block; padding: 1px 12px; margin: 4px 0; }
                .header-text p { font-size: 9.5pt; color: #333; margin: 2px 0 0; }
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
        `;

        // Render Page 1 (Admission Form Details)
        const page1 = document.createElement('div');
        page1.className = 'application-form';
        page1.innerHTML = `
            ${commonStyle}
            <div id="watermark-placeholder" class="watermark"></div>
            ${details?.applicationStatus !== 'REJECTED' ? `<div class="confirmed-stamp">${pdfStatus}</div>` : ''}
            <div class="header">
                <div class="header-top">
                    <div class="logo-box" id="logo-placeholder"></div>
                    <div class="header-text" style="padding-right: 80px;">
                        <h1>JAIN COLLEGE OF ENGINEERING AND RESEARCH</h1>
                        <p style="font-size:8px;color:#475569;">(Approved by AICTE, New Delhi, Affiliated to VTU Belagavi &amp; Recognized by Govt. of Karnataka)</p>
                        <h2>ADMISSION APPLICATION FORM</h2>
                        <p>Academic Session ${details?.academicYear || getAcademicYear()}</p>
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
                            <tr><td colspan="2" class="subheader">SSLC / 10th Standard</td></tr>
                            <tr><td class="label">School / Institution</td><td class="value">${acad?.tenthSchool || acad?.sslcSchool || '—'}</td></tr>
                            <tr><td class="label">Board</td><td class="value">${acad?.tenthBoard || acad?.sslcBoard || '—'}</td></tr>
                            <tr><td class="label">Register Number</td><td class="value">${acad?.tenthRegisterNumber || acad?.sslcRegisterNumber || '—'}</td></tr>
                            <tr><td class="label">Year of Passing</td><td class="value">${acad?.tenthPassingYear || acad?.sslcYear || '—'}</td></tr>
                            <tr><td class="label">Obtained / Max Marks</td><td class="value">${(acad?.tenthMarksObtained || acad?.tenthObtainedMarks) ? `${acad?.tenthMarksObtained || acad?.tenthObtainedMarks} / ${acad?.tenthMaxMarks || '—'}` : '—'}</td></tr>
                            <tr><td class="label">Percentage</td><td class="value">${acad?.tenthPercentage ? `${acad.tenthPercentage}%` : '—'}</td></tr>
                            ${showPUC ? `
                            <tr><td colspan="2" class="subheader">PUC / 12th Standard</td></tr>
                            <tr><td class="label">College / Institution</td><td class="value">${acad?.twelfthCollege || acad?.twelfthSchool || '—'}</td></tr>
                            <tr><td class="label">Board</td><td class="value">${acad?.twelfthBoard || '—'}</td></tr>
                            <tr><td class="label">Stream</td><td class="value">${acad?.twelfthStream || '—'}</td></tr>
                            <tr><td class="label">Register Number</td><td class="value">${acad?.twelfthRegisterNumber || '—'}</td></tr>
                            <tr><td class="label">Year of Passing</td><td class="value">${acad?.twelfthPassingYear || '—'}</td></tr>
                            <tr><td class="label">Obtained / Max Marks</td><td class="value">${acad?.twelfthObtainedMarks ? `${acad.twelfthObtainedMarks} / ${acad?.twelfthMaxMarks || '—'}` : '—'}</td></tr>
                            <tr><td class="label">Percentage</td><td class="value">${acad?.twelfthPercentage ? `${acad.twelfthPercentage}%` : '—'}</td></tr>
                            ` : ''}
                            ${showDiploma ? `
                            <tr><td colspan="2" class="subheader">Diploma Details (Lateral Entry)</td></tr>
                            <tr><td class="label">University / Board</td><td class="value">${acad?.diplomaUniversity || '—'}</td></tr>
                            <tr><td class="label">Branch / Stream</td><td class="value">${acad?.diplomaBranch || '—'}</td></tr>
                            <tr><td class="label">Year of Passing</td><td class="value">${acad?.diplomaYear || acad?.diplomaPassingYear || '—'}</td></tr>
                            <tr><td class="label">Percentage</td><td class="value">${acad?.diplomaPercentage ? `${acad.diplomaPercentage}%` : '—'}</td></tr>
                            ` : ''}
                            ${(acad?.cetRank || acad?.entranceRank) ? `
                            <tr><td colspan="2" class="subheader">Entrance Examination</td></tr>
                            <tr><td class="label">Entrance Rank</td><td class="value">${acad?.cetRank || acad?.entranceRank}</td></tr>
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
                    <div id="signature-placeholder"></div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Applicant Signature</div>
                </div>
            </div>

            <div class="footer">
                <p>Admission No: ${details?.applicationNumber || 'N/A'} &nbsp;|&nbsp; Status: ${pdfStatus} &nbsp;|&nbsp; Printed on: ${new Date().toLocaleString('en-IN')}</p>
                <div style="border-top:1px solid #dde1e8;margin:5px 0;"></div>
                <p>Contact: 099448693987 | principal@jcer.in</p>
            </div>
        `;

        // Inject page 1 programmatically loaded images
        const watermarkContainer = page1.querySelector('#watermark-placeholder');
        if (watermarkImg && watermarkContainer) {
            watermarkImg.style.width = '100%';
            watermarkImg.style.height = '100%';
            watermarkImg.style.objectFit = 'contain';
            watermarkContainer.appendChild(watermarkImg);
        }

        const logoContainer = page1.querySelector('#logo-placeholder');
        if (logoImg && logoContainer) {
            logoImg.style.width = '100%';
            logoImg.style.height = '100%';
            logoImg.style.objectFit = 'contain';
            logoContainer.appendChild(logoImg);
        } else if (logoContainer) {
            logoContainer.innerHTML = `<span>Logo</span>`;
        }

        const signatureContainer = page1.querySelector('#signature-placeholder');
        if (signatureImg && signatureContainer) {
            signatureImg.className = 'signature-img';
            signatureContainer.appendChild(signatureImg);
        } else if (signatureContainer) {
            signatureContainer.innerHTML = `<span style="font-size: 8px; color: #999; display: block; margin-bottom: 5px;">Signature Not Uploaded</span>`;
        }

        wrapper.appendChild(page1);

        // Render Page 2 (Supporting Documents)
        let page2 = null;
        if (resolvedImageDocs.length > 0) {
            page2 = document.createElement('div');
            page2.className = 'application-form';
            page2.innerHTML = `
                ${commonStyle}
                <div id="watermark-placeholder-p2" class="watermark"></div>
                <div class="section" style="margin-top: 10px;">
                    <div class="section-title">SUPPORTING DOCUMENTS</div>
                    <div class="section-content" style="border: none;">
                        <div id="docs-placeholder" style="display: grid; grid-template-columns: 1fr; gap: 30px; margin-top: 15px;"></div>
                    </div>
                </div>
            `;

            const watermarkImgP2 = logoBase64 ? await createImageElement(logoBase64, "Watermark P2") : null;
            const watermarkContainerP2 = page2.querySelector('#watermark-placeholder-p2');
            if (watermarkImgP2 && watermarkContainerP2) {
                watermarkImgP2.style.width = '100%';
                watermarkImgP2.style.height = '100%';
                watermarkImgP2.style.objectFit = 'contain';
                watermarkContainerP2.appendChild(watermarkImgP2);
            }

            const docsContainer = page2.querySelector('#docs-placeholder');
            for (const d of resolvedImageDocs) {
                const docImg = await createImageElement(d.base64, d.label, '', {
                    maxWidth: '100%',
                    maxHeight: '380px',
                    objectFit: 'contain'
                });
                if (docImg && docsContainer) {
                    const card = document.createElement('div');
                    card.style.pageBreakInside = 'avoid';
                    card.style.border = '1px solid #dde1e8';
                    card.style.padding = '15px';
                    card.style.background = 'white';
                    card.style.textAlign = 'center';
                    
                    const title = document.createElement('h3');
                    title.style.fontSize = '11pt';
                    title.style.color = '#1a3c6e';
                    title.style.marginBottom = '10px';
                    title.style.borderBottom = '2px solid #1a3c6e';
                    title.style.display = 'inline-block';
                    title.style.paddingBottom = '3px';
                    title.innerText = d.label;
                    
                    const imgWrapper = document.createElement('div');
                    imgWrapper.style.maxHeight = '400px';
                    imgWrapper.style.display = 'flex';
                    imgWrapper.style.alignItems = 'center';
                    imgWrapper.style.justifyContent = 'center';
                    imgWrapper.style.overflow = 'hidden';
                    imgWrapper.style.marginTop = '5px';
                    
                    imgWrapper.appendChild(docImg);
                    card.appendChild(title);
                    card.appendChild(imgWrapper);
                    docsContainer.appendChild(card);
                }
            }

            wrapper.appendChild(page2);
        }

        // Add to body offscreen but in DOM flow
        document.body.appendChild(wrapper);

        // Verify all images loaded and naturalWidth > 0 (Task 4 verification)
        const wrapperImages = Array.from(wrapper.getElementsByTagName('img'));
        console.log(`[Image Verification] Checking ${wrapperImages.length} images before html2canvas:`);
        let hasFailedImage = false;
        
        wrapperImages.forEach((img, idx) => {
            console.log(`Image #${idx + 1}:`);
            console.log(`- Src length: ${img.src.length}`);
            console.log(`- Src prefix: ${img.src.substring(0, 100)}...`);
            console.log(`- Complete: ${img.complete}`);
            console.log(`- NaturalWidth: ${img.naturalWidth}`);
            console.log(`- NaturalHeight: ${img.naturalHeight}`);
            
            if (img.naturalWidth === 0) {
                hasFailedImage = true;
                console.error(`[Image Verification] Image #${idx + 1} (${img.alt || 'No alt'}) has naturalWidth === 0! It failed to render.`);
            }
        });

        if (hasFailedImage) {
            toast.dismiss(toastId);
            toast.error("One or more images failed to render correctly. PDF generation aborted.");
            document.body.removeChild(wrapper);
            throw new Error("PDF generation stopped: one or more images had naturalWidth === 0");
        }

        // Delay to allow decoder pipeline to catch up
        await new Promise(r => setTimeout(r, 600));

        // Generate Canvas for Page 1
        const canvas1 = await html2canvas(page1, {
            useCORS: true,
            allowTaint: false,
            scale: 2,
            backgroundColor: "#ffffff",
            logging: true,
            imageTimeout: 30000
        });

        // Debug download canvas as PNG (Task 2 & 5 verification)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try {
                const link = document.createElement('a');
                link.download = `debug_canvas_page1.png`;
                link.href = canvas1.toDataURL('image/png');
                link.click();
                console.log(`[Canvas Debug] Triggered download of debug_canvas_page1.png`);
            } catch (canvasErr) {
                console.error("[Canvas Debug] Failed to export debug canvas:", canvasErr);
            }
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;

        // Render Page 1 image onto A4 page
        const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
        const imgData1 = canvas1.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData1, 'JPEG', 0, 0, imgWidth, imgHeight1);

        // Render Page 2 if exists
        if (page2) {
            const canvas2 = await html2canvas(page2, {
                useCORS: true,
                allowTaint: false,
                scale: 2,
                backgroundColor: "#ffffff",
                logging: true,
                imageTimeout: 30000
            });
            
            // Debug download canvas 2 as PNG
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                try {
                    const link2 = document.createElement('a');
                    link2.download = `debug_canvas_page2.png`;
                    link2.href = canvas2.toDataURL('image/png');
                    link2.click();
                    console.log(`[Canvas Debug] Triggered download of debug_canvas_page2.png`);
                } catch (canvasErr) {
                    console.error("[Canvas Debug] Failed to export debug canvas 2:", canvasErr);
                }
            }

            const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
            const imgData2 = canvas2.toDataURL('image/jpeg', 1.0);
            pdf.addPage();
            pdf.addImage(imgData2, 'JPEG', 0, 0, imgWidth, imgHeight2);
        }

        // Save downloaded PDF
        pdf.save(`Admission_Form_${details?.applicationNumber || 'Acknowledgment'}.pdf`);

        // Clean up DOM wrapper
        document.body.removeChild(wrapper);
        toast.dismiss(toastId);
    } catch (error) {
        toast.dismiss(toastId);
        console.error("PDF generation failed:", error);
        toast.error('Failed to generate admission PDF: ' + (error.response?.data?.message || error.message));
    }
};
