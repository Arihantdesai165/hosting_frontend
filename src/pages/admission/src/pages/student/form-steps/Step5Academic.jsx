import React, { useState } from 'react';
import api from '../../../api/axios';
import { Loader2, ChevronLeft, ChevronRight, School, GraduationCap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import SelectDropdown from '../../../components/SelectDropdown';


const Step5Academic = ({ onNext, onPrev, data, updateData, applicationStatus, readOnly = false }) => {
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const BOARDS_CONFIG = {
        STATE: {
            board: 'STATE',
            subjects: [
                { name: "firstLanguageMarks", label: "First Language", max: 125 },
                { name: "secondLanguageMarks", label: "Second Language", max: 100 },
                { name: "thirdLanguageSubject", label: "Third Language Subject", type: "dropdown" },
                { name: "thirdLanguageMarks", label: "Third Language Marks", max: 100 },
                { name: "mathematicsMarks", label: "Mathematics", max: 100 },
                { name: "scienceMarks", label: "Science", max: 100 },
                { name: "socialScienceMarks", label: "Social Science", max: 100 }
            ],
            calculate: (marks) => {
                const subjectKeys = [
                    'firstLanguageMarks',
                    'secondLanguageMarks',
                    'thirdLanguageMarks',
                    'mathematicsMarks',
                    'scienceMarks',
                    'socialScienceMarks'
                ];
                let sum = 0;
                for (const key of subjectKeys) {
                    const markVal = marks[key];
                    if (markVal !== "" && markVal !== undefined && markVal !== null && /^\d+$/.test(String(markVal))) {
                        sum += parseInt(markVal);
                    }
                }
                const maxMarks = 625;
                const percentage = (sum / maxMarks) * 100;
                return {
                    totalMarks: sum,
                    totalMarksEntered: sum,
                    admissionTotal: sum,
                    maximumMarks: maxMarks,
                    percentage: percentage.toFixed(2)
                };
            }
        },
        CBSE: {
            board: 'CBSE',
            subjects: [
                { name: "englishMarks", label: "English", max: 100 },
                { name: "language2Marks", label: "Language II", max: 100 },
                { name: "mathematicsMarks", label: "Mathematics", max: 100 },
                { name: "scienceMarks", label: "Science", max: 100 },
                { name: "socialScienceMarks", label: "Social Science", max: 100 }
            ],
            calculate: (marks) => {
                const subjectKeys = [
                    'englishMarks',
                    'language2Marks',
                    'mathematicsMarks',
                    'scienceMarks',
                    'socialScienceMarks'
                ];
                let sum = 0;
                for (const key of subjectKeys) {
                    const markVal = marks[key];
                    if (markVal !== "" && markVal !== undefined && markVal !== null && /^\d+$/.test(String(markVal))) {
                        sum += parseInt(markVal);
                    }
                }
                const maxMarks = 500;
                const percentage = (sum / maxMarks) * 100;
                return {
                    totalMarksEntered: sum,
                    admissionTotal: sum,
                    maximumMarks: maxMarks,
                    percentage: percentage.toFixed(2)
                };
            }
        },
        ICSE: {
            board: 'ICSE',
            subjects: [
                { name: "englishMarks", label: "English", max: 100 },
                { name: "secondLanguageMarks", label: "Second Language", max: 100 },
                { name: "mathematicsMarks", label: "Mathematics", max: 100 },
                { name: "scienceMarks", label: "Science", max: 100 },
                { name: "socialScienceMarks", label: "Social Science", max: 100 },
                { name: "electiveSubjectMarks", label: "Elective / Optional Subject", max: 100 }
            ],
            calculate: (marks) => {
                const englishVal = marks['englishMarks'];
                const englishMark = (englishVal !== "" && englishVal !== undefined && englishVal !== null && /^\d+$/.test(String(englishVal))) ? parseInt(englishVal) : 0;

                const otherKeys = [
                    'secondLanguageMarks',
                    'mathematicsMarks',
                    'scienceMarks',
                    'socialScienceMarks',
                    'electiveSubjectMarks'
                ];

                const otherMarks = [];
                let totalEntered = englishMark;

                for (const key of otherKeys) {
                    const val = marks[key];
                    const markNum = (val !== "" && val !== undefined && val !== null && /^\d+$/.test(String(val))) ? parseInt(val) : 0;
                    otherMarks.push(markNum);
                    totalEntered += markNum;
                }

                // Sort other marks descending and pick top 4
                otherMarks.sort((a, b) => b - a);
                const top4OthersSum = otherMarks.slice(0, 4).reduce((sum, val) => sum + val, 0);

                const admissionTotal = englishMark + top4OthersSum;
                const maxMarks = 500;
                const percentage = (admissionTotal / maxMarks) * 100;

                return {
                    totalMarksEntered: totalEntered,
                    admissionTotal: admissionTotal,
                    maximumMarks: 500,
                    percentage: percentage.toFixed(2)
                };
            }
        },
        OTHER: {
            board: 'OTHER',
            subjects: [
                { name: "sslcMaxMarksInput", label: "Maximum Marks" },
                { name: "sslcMarksObtainedInput", label: "Marks Obtained" }
            ],
            calculate: (marks) => {
                return {
                    totalMarksEntered: marks.sslcMarksObtainedInput || 0,
                    admissionTotal: marks.sslcMarksObtainedInput || 0,
                    maximumMarks: marks.sslcMaxMarksInput || 0,
                    percentage: marks.sslcMaxMarksInput > 0 ? ((marks.sslcMarksObtainedInput / marks.sslcMaxMarksInput) * 100).toFixed(2) : '0.00'
                };
            }
        }
    };

    const validateSubjectMark = (name, val) => {
        if (val === "" || val === undefined || val === null) {
            return "Marks is required.";
        }
        const num = Number(val);
        if (!/^\d+$/.test(String(val))) {
            return "Only whole numbers are allowed.";
        }
        if (num < 0) {
            return "Marks cannot be negative.";
        }

        const board = data.sslcBoard;
        if (board === 'OTHER') {
            return "";
        }

        const config = BOARDS_CONFIG[board];
        if (config) {
            const field = config.subjects.find(s => s.name === name);
            if (field) {
                if (num > field.max) {
                    return `Marks cannot exceed ${field.max}.`;
                }
            }
        }
        return "";
    };

    const handleFieldChange = (name, val) => {
        const errorMsg = validateSubjectMark(name, val);

        setValidationErrors(prev => ({
            ...prev,
            [name]: errorMsg
        }));

        const board = data.sslcBoard;
        const config = BOARDS_CONFIG[board];
        if (!config) return;

        if (board === 'OTHER') {
            const dbField = name === 'sslcMaxMarksInput' ? 'sslcMaxMarks' : 'sslcMarksObtained';
            const updatedFields = { [dbField]: val };
            updateData(updatedFields);

            const combinedData = { ...data, ...updatedFields };
            const maxMarks = parseInt(combinedData.sslcMaxMarks) || 0;
            const obtained = parseInt(combinedData.sslcMarksObtained) || 0;

            if (maxMarks < 0) {
                setValidationErrors(prev => ({ ...prev, sslcMaxMarksInput: "Marks cannot be negative." }));
            } else {
                setValidationErrors(prev => ({ ...prev, sslcMaxMarksInput: "" }));
            }

            if (obtained < 0) {
                setValidationErrors(prev => ({ ...prev, sslcMarksObtainedInput: "Marks cannot be negative." }));
            } else if (maxMarks > 0 && obtained > maxMarks) {
                setValidationErrors(prev => ({ ...prev, sslcMarksObtainedInput: "Obtained marks cannot exceed maximum marks." }));
            } else {
                setValidationErrors(prev => ({ ...prev, sslcMarksObtainedInput: "" }));
            }

            const percentage = maxMarks > 0 ? ((obtained / maxMarks) * 100).toFixed(2) : '0.00';
            updateData({ sslcPercentage: percentage });

            const newSslcSubjectMarks = {
                board: 'OTHER',
                totalMarksEntered: obtained,
                admissionTotal: obtained,
                maximumMarks: maxMarks,
                percentage: percentage
            };
            updateData({ sslcSubjectMarks: newSslcSubjectMarks });
        } else {
            const updatedMarks = {
                ...(data.sslcSubjectMarks || {}),
                [name]: val
            };

            const result = config.calculate(updatedMarks);

            const newSslcSubjectMarks = {
                ...updatedMarks,
                board: board,
                totalMarksEntered: result.totalMarksEntered,
                admissionTotal: result.admissionTotal,
                maximumMarks: result.maximumMarks,
                percentage: result.percentage
            };

            updateData({
                sslcSubjectMarks: newSslcSubjectMarks,
                sslcMarksObtained: result.admissionTotal,
                sslcMaxMarks: result.maximumMarks,
                sslcPercentage: result.percentage
            });
        }
    };

    const handleThirdLanguageSubjectChange = (val) => {
        const board = data.sslcBoard;
        const config = BOARDS_CONFIG[board];
        const newSslcSubjectMarks = {
            ...(data.sslcSubjectMarks || {}),
            thirdLanguageSubject: val
        };
        const result = config.calculate(newSslcSubjectMarks);
        updateData({
            sslcSubjectMarks: {
                ...newSslcSubjectMarks,
                totalMarks: result.totalMarks,
                totalMarksEntered: result.totalMarksEntered,
                admissionTotal: result.admissionTotal,
                maximumMarks: result.maximumMarks,
                percentage: result.percentage
            }
        });
    };

    const isSslcFormValid = () => {
        const board = data.sslcBoard;
        if (!board) return false;

        const config = BOARDS_CONFIG[board];
        if (!config) return false;

        const subjectMarks = data.sslcSubjectMarks || {};

        if (board === 'OTHER') {
            const maxVal = data.sslcMaxMarks;
            const obtVal = data.sslcMarksObtained;
            if (!maxVal || !obtVal) return false;
            if (!/^\d+$/.test(String(maxVal)) || !/^\d+$/.test(String(obtVal))) return false;
            if (parseInt(obtVal) > parseInt(maxVal)) return false;
            if (parseInt(maxVal) < 0 || parseInt(obtVal) < 0) return false;
        } else {
            for (const field of config.subjects) {
                const val = subjectMarks[field.name];
                if (field.type === "dropdown") {
                    if (!val) return false;
                } else {
                    if (val === undefined || val === "" || val === null) {
                        return false;
                    }
                    if (validateSubjectMark(field.name, val) !== "") {
                        return false;
                    }
                }
            }
        }

        if (!data.sslcSchool || !data.sslcBoard || !data.sslcYear || !data.sslcRegisterNumber || !data.sslcAttempts) {
            return false;
        }

        if (isSslcRegInvalid) {
            return false;
        }

        return true;
    };

    const validatePucMark = (val) => {
        if (val === "" || val === undefined || val === null) return "";
        const num = Number(val);
        if (isNaN(num)) return "Enter a valid number.";
        if (num < 0 || num > 100) return "Marks cannot exceed 100.";
        return "";
    };

    const isPucFormValid = () => {
        if (data.qualification === 'DIPLOMA') return true;

        const subjectKeys = ['physicsMarks', 'chemistryMarks', 'mathsMarks', 'optionalMarks'];
        for (const key of subjectKeys) {
            const val = data[key];
            if (val !== undefined && val !== "" && val !== null) {
                const num = Number(val);
                if (isNaN(num) || num < 0 || num > 100) return false;
            }
            if (validationErrors[key]) return false;
        }

        const phys = parseFloat(data.physicsMarks) || 0;
        const math = parseFloat(data.mathsMarks) || 0;
        const chem = parseFloat(data.chemistryMarks) || 0;
        const opt = parseFloat(data.optionalMarks) || 0;
        const total = phys + math + chem + opt;

        if (total > 400) return false;

        return true;
    };

    const calculatePUC = (updatedData = data) => {
        const phys = parseFloat(updatedData.physicsMarks) || 0;
        const math = parseFloat(updatedData.mathsMarks) || 0;
        const chem = parseFloat(updatedData.chemistryMarks) || 0;
        const opt = parseFloat(updatedData.optionalMarks) || 0;
        const max = 400;

        const agg = phys + math + chem + opt;
        let perc = (agg / max) * 100;
        if (perc > 100) perc = 100;
        if (perc < 0) perc = 0;

        updateData({
            pucAggregate: agg,
            pucPercentage: perc.toFixed(2),
            pucMaxMarks: max
        });
    };

    const calculateDiploma = (updatedData = data) => {
        const obtained = parseFloat(updatedData.diplomaFinalYearObtained) || 0;
        const max = parseFloat(updatedData.diplomaFinalYearMaxMarks) || 0;
        if (max > 0) {
            const perc = (obtained / max) * 100;
            updateData({ diplomaPercentage: perc.toFixed(2) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (readOnly) {
            onNext();
            return;
        }

        if (!isSslcFormValid()) {
            toast.error("Please fill all subject marks correctly before continuing.");
            return;
        }

        if (data.qualification !== 'DIPLOMA' && !isPucFormValid()) {
            toast.error("Please correct the PUC subject marks before continuing. Marks cannot exceed 100 per subject.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                sslcSchool: data.sslcSchool,
                sslcBoard: data.sslcBoard,
                sslcYear: parseInt(data.sslcYear),
                sslcRegisterNumber: data.sslcRegisterNumber,
                sslcMarksObtained: parseFloat(data.sslcMarksObtained),
                sslcMaxMarks: parseFloat(data.sslcMaxMarks),
                sslcPercentage: parseFloat(data.sslcPercentage),
                sslcAttempts: parseInt(data.sslcAttempts),
                sslcSubjectMarks: data.sslcSubjectMarks || null,
                pucSchool: data.pucSchool || undefined,
                pucBoard: data.pucBoard || undefined,
                pucYear: data.pucYear ? parseInt(data.pucYear) : undefined,
                pucRegisterNumber: data.pucRegisterNumber || undefined,
                pucStream: data.pucStream || undefined,
                physicsMarks: data.physicsMarks ? parseFloat(data.physicsMarks) : undefined,
                mathsMarks: data.mathsMarks ? parseFloat(data.mathsMarks) : undefined,
                chemistryMarks: data.chemistryMarks ? parseFloat(data.chemistryMarks) : undefined,
                optionalSubject: data.optionalSubject || undefined,
                optionalMarks: data.optionalMarks ? parseFloat(data.optionalMarks) : undefined,
                pucMaxMarks: data.pucMaxMarks ? parseFloat(data.pucMaxMarks) : undefined,
                pucAggregate: data.pucAggregate ? parseFloat(data.pucAggregate) : undefined,
                pucPercentage: data.pucPercentage ? parseFloat(data.pucPercentage) : undefined,
                pucAttempts: data.pucAttempts ? parseInt(data.pucAttempts) : undefined,
                diplomaUniversity: data.diplomaUniversity || undefined,
                diplomaYear: data.diplomaYear ? parseInt(data.diplomaYear) : undefined,
                diplomaRegisterNumber: data.diplomaRegisterNumber || undefined,
                diplomaFinalYearMaxMarks: data.diplomaFinalYearMaxMarks ? parseFloat(data.diplomaFinalYearMaxMarks) : undefined,
                diplomaFinalYearObtained: data.diplomaFinalYearObtained ? parseFloat(data.diplomaFinalYearObtained) : undefined,
                diplomaPercentage: data.diplomaPercentage ? parseFloat(data.diplomaPercentage) : undefined,
                diplomaAttempts: data.diplomaAttempts ? parseInt(data.diplomaAttempts) : undefined,
            };

            const res = await api.put('/student/academic', payload);
            if (res.data.success) {
                toast.success('Academic details saved!');
                onNext();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save academic details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedFields = { [name]: value };
        updateData(updatedFields);

        const combinedData = { ...data, ...updatedFields };
        if (name === 'diplomaFinalYearObtained' || name === 'diplomaFinalYearMaxMarks') {
            calculateDiploma(combinedData);
        }
    };

    const handleBoardChange = (e) => {
        const board = e.target.value;
        updateData({
            sslcBoard: board,
            sslcSubjectMarks: {},
            sslcMarksObtained: '',
            sslcMaxMarks: '',
            sslcPercentage: ''
        });
        setValidationErrors({});
    };

    const handlePucChange = (e) => {
        const { name, value } = e.target;
        const updatedFields = { [name]: value };

        if (['physicsMarks', 'chemistryMarks', 'mathsMarks', 'optionalMarks'].includes(name)) {
            const err = validatePucMark(value);
            setValidationErrors(prev => ({
                ...prev,
                [name]: err
            }));
        }

        updateData(updatedFields);
        calculatePUC({ ...data, ...updatedFields });
    };

    const SectionHeader = ({ icon: Icon, title, subtitle }) => (
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5 mt-8 first:mt-0">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <Icon size={18} />
            </div>
            <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
        </div>
    );

    const renderBoardFields = () => {
        const board = data.sslcBoard;
        if (!board) return null;

        const config = BOARDS_CONFIG[board];
        if (!config) return null;

        const subjectMarks = data.sslcSubjectMarks || {};

        return config.subjects.map((field) => {
            if (field.type === "dropdown") {
                return (
                    <div key={field.name} className="space-y-1.5 animate-fade-in">
                        <label className="text-sm font-medium text-slate-700">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <SelectDropdown
                            id={field.name}
                            name={field.name}
                            required
                            value={subjectMarks[field.name] || ''}
                            onChange={(val) => handleThirdLanguageSubjectChange(val)}
                            placeholder="Select subject..."
                            options={[
                                { value: 'Kannada', label: 'Kannada' },
                                { value: 'Hindi', label: 'Hindi' },
                                { value: 'Sanskrit', label: 'Sanskrit' },
                                { value: 'Urdu', label: 'Urdu' },
                                { value: 'Tamil', label: 'Tamil' },
                                { value: 'Telugu', label: 'Telugu' },
                                { value: 'Marathi', label: 'Marathi' },
                                { value: 'Other', label: 'Other' },
                            ]}
                        />
                    </div>
                );
            }

            const isOther = board === 'OTHER';
            const val = isOther
                ? (field.name === 'sslcMaxMarksInput' ? (data.sslcMaxMarks || '') : (data.sslcMarksObtained || ''))
                : (subjectMarks[field.name] || '');

            const error = isOther
                ? (field.name === 'sslcMaxMarksInput' ? validationErrors.sslcMaxMarksInput : validationErrors.sslcMarksObtainedInput)
                : validationErrors[field.name];

            return (
                <div key={field.name} className="space-y-1.5 animate-fade-in">
                    <label className="text-sm font-medium text-slate-700">
                        {field.label} {field.max && `(Max ${field.max})`} <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        type="text"
                        name={field.name}
                        className={`input-premium h-11 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={val}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        onBlur={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.max ? `Enter marks (max ${field.max})` : `Enter marks`}
                    />
                    {error && (
                        <p className="text-red-500 text-[11px] font-semibold mt-1 animate-fade-in">
                            {error}
                        </p>
                    )}
                </div>
            );
        });
    };

    const sslcRegProps = data.sslcBoard === 'CBSE'
        ? { minLength: 6, maxLength: 6, pattern: "\\d{6}", title: "Must be exactly 6 digits (Numeric only)" }
        : data.sslcBoard === 'STATE'
            ? { minLength: 9, maxLength: 9, pattern: "\\d{9}", title: "Must be exactly 9 digits (Numeric only)" }
            : { minLength: 4, maxLength: 20, title: "Enter valid register number" };

    const pucRegProps = data.pucBoard === 'STATE'
        ? { minLength: 7, maxLength: 10, title: "Usually 7-10 characters" }
        : data.pucBoard === 'CBSE'
            ? { minLength: 6, maxLength: 8, title: "Usually 6-8 characters" }
            : { minLength: 4, maxLength: 20, title: "Enter valid register number" };

    const isSslcRegInvalid = data.sslcRegisterNumber && data.sslcBoard && (
        sslcRegProps.pattern
            ? !new RegExp(`^${sslcRegProps.pattern}$`).test(data.sslcRegisterNumber)
            : data.sslcRegisterNumber.length < sslcRegProps.minLength || data.sslcRegisterNumber.length > sslcRegProps.maxLength
    );

    const isPucRegInvalid = data.pucRegisterNumber && data.pucBoard && (
        pucRegProps.pattern
            ? !new RegExp(`^${pucRegProps.pattern}$`).test(data.pucRegisterNumber)
            : data.pucRegisterNumber.length < pucRegProps.minLength || data.pucRegisterNumber.length > pucRegProps.maxLength
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in flex flex-col">
            <fieldset disabled={readOnly} className="space-y-6 flex flex-col p-0 m-0 border-0 w-full">
            {/* SSLC Section */}
            <div>
                <SectionHeader icon={School} title="SSLC (10th Standard) Details" subtitle="Secondary education academic records" />

                {/* Core Board details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5 pb-5 border-b border-slate-100">
                    <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-4">
                        <label className="text-sm font-medium text-slate-700">School Name ( SSLC) <span className="text-red-500">*</span></label>
                        <input required type="text" name="sslcSchool" className="input-premium h-11 uppercase" value={data.sslcSchool || ''} onChange={handleChange} placeholder="Enter your 10th standard school name" />
                        {!data.sslcSchool && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Board <span className="text-red-500">*</span></label>
                        <SelectDropdown
                            id="sslcBoard" name="sslcBoard" required
                            value={data.sslcBoard || ''}
                            onChange={(val) => handleBoardChange({ target: { name: 'sslcBoard', value: val } })}
                            placeholder="Select board..."
                            options={[
                                { value: 'STATE', label: 'State Board' },
                                { value: 'CBSE', label: 'CBSE' },
                                { value: 'ICSE', label: 'ICSE' },
                                { value: 'OTHER', label: 'Other' },
                            ]}
                        />
                        {!data.sslcBoard && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                        {data.sslcBoard === 'CBSE' && (
                            <p className="text-[11px] text-primary-600 font-medium mt-1">ℹ️ CBSE: Best of 5 subjects rule applied.</p>
                        )}
                        {data.sslcBoard === 'ICSE' && (
                            <p className="text-[11px] text-primary-600 font-medium mt-1">ℹ️ ICSE: English compulsory + best of 4 others.</p>
                        )}
                        {data.sslcBoard === 'STATE' && (
                            <p className="text-[11px] text-primary-600 font-medium mt-1">ℹ️ State: Subject-wise marks out of 625.</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Year of Passing <span className="text-red-500">*</span></label>
                        <input required type="number" name="sslcYear" className="input-premium h-11" value={data.sslcYear || ''} onChange={handleChange} placeholder="Enter year of passing" />
                        {!data.sslcYear && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Register Number <span className="text-red-500">*</span></label>
                        <input required type="text" name="sslcRegisterNumber" className="input-premium h-11 uppercase" value={data.sslcRegisterNumber || ''} onChange={handleChange} placeholder="Enter register number" {...sslcRegProps} />
                        {!data.sslcRegisterNumber && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                        {isSslcRegInvalid && <p className="text-[10px] text-red-500 font-medium mt-1">⚠️ {sslcRegProps.title}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">No. of Attempts <span className="text-red-500">*</span></label>
                        <input required type="number" min="1" name="sslcAttempts" className="input-premium h-11" value={data.sslcAttempts || ''} onChange={handleChange} placeholder="1" />
                        {!data.sslcAttempts && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                </div>

                {/* Dynamic Board-specific Subject details */}
                {data.sslcBoard && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <GraduationCap size={16} className="text-primary-500" />
                            Subject-Wise Mark Sheet (10th Standard)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {renderBoardFields()}
                        </div>

                        {/* Automatic Total & Percentage Display */}
                        {data.sslcBoard === 'ICSE' ? (
                            <div className="mt-5 p-4 bg-slate-100 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between gap-4 font-semibold text-slate-700 text-sm">
                                <div>Total Marks Entered: {data.sslcSubjectMarks?.totalMarksEntered || 0} / 600</div>
                                <div>Best of Five: {data.sslcMarksObtained || 0} / 500</div>
                                <div>Percentage: {data.sslcPercentage || '0.00'}%</div>
                            </div>
                        ) : (
                            <div className="mt-5 p-4 bg-slate-100 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between gap-4 font-semibold text-slate-700 text-sm">
                                <div>Total Obtained: {data.sslcMarksObtained || 0} / {data.sslcMaxMarks || 625}</div>
                                <div>Percentage: {data.sslcPercentage || '0.00'}%</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Readonly Evaluated Aggregates */}
                {data.sslcBoard && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Total Max Marks</label>
                            <input readOnly type="number" className="input-premium h-11 text-slate-700 bg-slate-50 border-slate-200 cursor-not-allowed font-semibold" value={data.sslcMaxMarks || ''} placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Total Marks Obtained</label>
                            <input readOnly type="number" className="input-premium h-11 text-slate-700 bg-slate-50 border-slate-200 cursor-not-allowed font-semibold" value={data.sslcMarksObtained || ''} placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Percentage (%)</label>
                            <input readOnly type="number" step="0.01" name="sslcPercentage" className="input-premium h-11 text-primary-700 font-semibold bg-primary-50 border-primary-100 cursor-not-allowed" value={data.sslcPercentage || ''} placeholder="0.00" />
                        </div>
                    </div>
                )}
            </div>

            {/* PUC Details (For Fresh Admissions) */}
            {data.qualification !== 'DIPLOMA' && (
                <div>
                    <SectionHeader icon={GraduationCap} title="PUC (12th Standard) Details" subtitle="Required — Senior secondary records" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                            <label className="text-sm font-medium text-slate-700">School / College Name <span className="text-red-500">*</span></label>
                            <input required type="text" name="pucSchool" className="input-premium h-11 uppercase" value={data.pucSchool || ''} onChange={handleChange} placeholder="Enter your 12th standard school/college name" />
                            {!data.pucSchool && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Board</label>
                            <SelectDropdown
                                id="pucBoard" name="pucBoard"
                                value={data.pucBoard || ''}
                                onChange={(val) => handleChange({ target: { name: 'pucBoard', value: val } })}
                                placeholder="Select board..."
                                options={[
                                    { value: 'STATE', label: 'State Board' },
                                    { value: 'CBSE', label: 'CBSE' },
                                    { value: 'ICSE', label: 'ICSE' },
                                    { value: 'OTHER', label: 'Other' },
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Year of Passing</label>
                            <input type="number" name="pucYear" className="input-premium h-11" value={data.pucYear || ''} onChange={handleChange} placeholder="Enter year of passing" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Register Number</label>
                            <input type="text" name="pucRegisterNumber" className="input-premium h-11 uppercase" value={data.pucRegisterNumber || ''} onChange={handleChange} placeholder="Enter register number" {...pucRegProps} />
                            {isPucRegInvalid && <p className="text-[10px] text-red-500 font-medium mt-1">⚠️ {pucRegProps.title}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Physics Marks (Max 100)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                name="physicsMarks"
                                className={`input-premium h-11 ${validationErrors.physicsMarks ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={data.physicsMarks || ''}
                                onChange={handlePucChange}
                                placeholder="Enter physics marks"
                            />
                            {validationErrors.physicsMarks && (
                                <p className="text-red-500 text-[11px] font-semibold mt-1 animate-fade-in">
                                    {validationErrors.physicsMarks}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Chemistry Marks (Max 100)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                name="chemistryMarks"
                                className={`input-premium h-11 ${validationErrors.chemistryMarks ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={data.chemistryMarks || ''}
                                onChange={handlePucChange}
                                placeholder="Enter chemistry marks"
                            />
                            {validationErrors.chemistryMarks && (
                                <p className="text-red-500 text-[11px] font-semibold mt-1 animate-fade-in">
                                    {validationErrors.chemistryMarks}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Maths Marks (Max 100)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                name="mathsMarks"
                                className={`input-premium h-11 ${validationErrors.mathsMarks ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={data.mathsMarks || ''}
                                onChange={handlePucChange}
                                placeholder="Enter maths marks"
                            />
                            {validationErrors.mathsMarks && (
                                <p className="text-red-500 text-[11px] font-semibold mt-1 animate-fade-in">
                                    {validationErrors.mathsMarks}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Biology / Computer Science (Max 100)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                name="optionalMarks"
                                className={`input-premium h-11 ${validationErrors.optionalMarks ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                value={data.optionalMarks || ''}
                                onChange={handlePucChange}
                                placeholder="Enter optional marks"
                            />
                            {validationErrors.optionalMarks && (
                                <p className="text-red-500 text-[11px] font-semibold mt-1 animate-fade-in">
                                    {validationErrors.optionalMarks}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Maximum Marks</label>
                            <input readOnly type="number" name="pucMaxMarks" className="input-premium h-11 text-slate-700 bg-slate-50 border-slate-200 cursor-not-allowed font-semibold" value={400} placeholder="400" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Total Obtained</label>
                            <input readOnly type="number" name="pucAggregate" className="input-premium h-11 text-slate-700 bg-slate-50 border-slate-200 cursor-not-allowed font-semibold" value={data.pucAggregate || 0} placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Percentage (%)</label>
                            <input readOnly type="number" step="0.01" name="pucPercentage" className="input-premium h-11 text-primary-700 font-semibold bg-primary-50 border-primary-100 cursor-not-allowed" value={data.pucPercentage || ''} placeholder="0.00" />
                        </div>
                    </div>
                </div>
            )}

            {/* Diploma Details (For Lateral Entry) */}
            {data.qualification === 'DIPLOMA' && (
                <div>
                    <SectionHeader icon={BookOpen} title="Diploma Details" subtitle="Required — Vocational education records" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">University</label>
                            <input type="text" name="diplomaUniversity" className="input-premium h-11 uppercase" value={data.diplomaUniversity || ''} onChange={handleChange} placeholder="Enter university" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Year of Passing</label>
                            <input type="number" name="diplomaYear" className="input-premium h-11" value={data.diplomaYear || ''} onChange={handleChange} placeholder="Enter year of passing" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Register Number</label>
                            <input type="text" name="diplomaRegisterNumber" className="input-premium h-11 uppercase" value={data.diplomaRegisterNumber || ''} onChange={handleChange} placeholder="Enter register number" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Final Year Max Marks</label>
                            <input type="number" name="diplomaFinalYearMaxMarks" className="input-premium h-11" value={data.diplomaFinalYearMaxMarks || ''} onChange={handleChange} placeholder="Enter final year max marks" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Final Year Obtained</label>
                            <input type="number" name="diplomaFinalYearObtained" className="input-premium h-11" value={data.diplomaFinalYearObtained || ''} onChange={handleChange} placeholder="Enter final year marks obtained" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Percentage (%)</label>
                            <input readOnly type="number" step="0.01" name="diplomaPercentage" className="input-premium h-11 text-primary-700 font-semibold bg-primary-50 border-primary-100 cursor-not-allowed" value={data.diplomaPercentage || ''} placeholder="0.00" />
                        </div>
                    </div>
                </div>
            )}
            </fieldset>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md p-3 sm:p-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 sm:static sm:bg-transparent z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:shadow-none">
                <button type="button" onClick={onPrev} className="btn-secondary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                    <ChevronLeft size={16} /> Back
                </button>
                <button type="submit" id="bottom-submit-btn" disabled={loading || !isSslcFormValid() || !isPucFormValid()} className={`btn-primary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold ${(loading || !isSslcFormValid() || !isPucFormValid()) ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>Save & Continue <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </form>
    );
};

export default Step5Academic;
