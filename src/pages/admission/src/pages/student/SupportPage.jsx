import React, { useState } from 'react';
import { 
    Phone, 
    Mail, 
    Clock, 
    CheckCircle2, 
    ChevronDown, 
    HelpCircle, 
    AlertCircle, 
    FileText, 
    Headphones,
    Sparkles
} from 'lucide-react';

const SupportPage = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: 'How can I edit my application?',
            answer: 'You can edit your application details and upload documents at any step before final submission. Once submitted, editing is locked unless the Admission Office returns your application for correction.'
        },
        {
            question: 'Which documents are mandatory?',
            answer: 'Mandatory documents include: Applicant E-Signature, SSLC (10th) Marks Card, PUC (12th) Marks Card OR Diploma 5th and 6th Semester Marks Cards (for Diploma applicants), Aadhaar Card, and Entrance Score Card (CET/DCET).'
        },
        {
            question: 'Can I upload black & white scanned copies?',
            answer: 'Yes! Clear black & white, grayscale, and color scanned copies of marks cards and certificates are accepted as long as all text is sharp, legible, and saved in JPG or PNG format (maximum file size 1 MB per document).'
        },
        {
            question: 'How can I check my application status?',
            answer: 'Log in to your Student Portal and view your Student Dashboard. Your current application stage (Draft, Submitted, Under Review, Approved, Fee Verified, or Enrolled) updates in real time.'
        },
        {
            question: 'Who should I contact for technical issues?',
            answer: 'If you experience technical difficulties during form submission or document upload, contact the Admission Helpdesk at 099448693987 or email principal@jcer.in with your Admission/Reference Number.'
        }
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                    <Headphones size={240} />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-primary-100">
                        <Sparkles size={14} className="text-amber-300" /> Admission Help Center
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Need Help?</h1>
                    <p className="text-sm sm:text-base text-primary-100 max-w-2xl leading-relaxed">
                        Our Admission Office is ready to assist you throughout your admission process. Find instant answers, document guidelines, or reach out directly to our team.
                    </p>
                </div>
            </div>

            {/* SECTION 1: Admission Office Assistance */}
            <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Headphones className="text-primary-600" size={20} /> Admission Office Assistance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {/* Phone */}
                    <a 
                        href="tel:099448693987"
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-3.5 mb-3">
                            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                                <p className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors">099448693987</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Click to call directly on mobile</p>
                    </a>

                    {/* Email */}
                    <a 
                        href="mailto:principal@jcer.in"
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-3.5 mb-3">
                            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                <p className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors truncate">principal@jcer.in</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Opens your email client directly</p>
                    </a>

                    {/* Office Hours */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-3.5 mb-3">
                            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Office Hours</p>
                                <p className="text-sm font-extrabold text-slate-900">Monday – Saturday</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100 w-fit">
                            9:30 AM – 5:30 PM
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Required Documents Checklist */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">Required Documents Checklist</h2>
                            <p className="text-xs text-slate-500">Ensure all mandatory documents are prepared before filling the form</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mandatory Documents */}
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Mandatory Documents</span>
                        <ul className="space-y-2.5">
                            {[
                                'Applicant Signature',
                                'SSLC Marks Card',
                            ].map((doc, idx) => (
                                <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                    <span>{doc}</span>
                                </li>
                            ))}
                            {/* PUC vs Diploma Branching */}
                            <li className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 my-1">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                    <span>PUC / 12th Marks Card</span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6">OR (For Diploma Applicants)</div>
                                <div className="pl-6 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                                        <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                                        <span>Diploma 5th Semester Marks Card</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                                        <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                                        <span>Diploma 6th Semester Marks Card</span>
                                    </div>
                                </div>
                            </li>
                            {[
                                'Aadhaar Card',
                                'CET / DCET Score Card',
                                'Fee Receipt',
                            ].map((doc, idx) => (
                                <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                    <span>{doc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Optional Documents */}
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Optional / Category Documents</span>
                        <ul className="space-y-2.5">
                            {[
                                'Income Certificate',
                                'Caste Certificate',
                                'Domicile Certificate',
                            ].map((doc, idx) => (
                                <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600">
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    </div>
                                    <span>{doc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Frequently Asked Questions (Accordion UI) */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
                        <p className="text-xs text-slate-500">Instant answers to common queries regarding the admission process</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div 
                                key={index} 
                                className={`rounded-xl border transition-all ${
                                    isOpen ? 'border-primary-300 bg-primary-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 focus:outline-none"
                                >
                                    <span>{faq.question}</span>
                                    <ChevronDown 
                                        size={18} 
                                        className={`text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} 
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECTION 4: Important Instructions */}
            <div className="bg-amber-50/80 border border-amber-200 p-6 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-amber-900">Important Instructions</h2>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-amber-900 font-medium">
                    <li className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-amber-200/60">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Upload only clear <strong>JPG/PNG</strong> images.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-amber-200/60">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Images should be sharp and fully readable.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-amber-200/60">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Keep your <strong>Admission Number</strong> ready when contacting support.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-amber-200/60">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Regularly check your <strong>Student Dashboard</strong> for status updates.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SupportPage;
