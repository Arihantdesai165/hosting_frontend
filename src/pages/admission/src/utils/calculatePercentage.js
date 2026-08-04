/**
 * Calculates percentage and validates marks based on board rules.
 * English-specific or Best-of-5 rules are applied here.
 */
export const calculatePercentage = (boardKey, marks) => {
    if (!boardKey || !marks) {
        return { percentage: 0, obtained: 0, max: 0, passed: false, error: "" };
    }

    // Initialize variables
    let obtained = 0;
    let max = 0;
    let passed = true;
    let error = "";

    // Load board config
    const config = boardKey === "CBSE" ? {
        totalMarks: 500,
        passingPercentage: 33,
        calculationRule: "BEST_OF_5",
        fields: [
            { name: "english", label: "English", max: 100, passing: 33, required: true },
            { name: "secondLanguage", label: "Second Language", max: 100, passing: 33, required: true },
            { name: "maths", label: "Mathematics", max: 100, passing: 33, required: true },
            { name: "science", label: "Science", max: 100, passing: 33, required: true },
            { name: "socialScience", label: "Social Science", max: 100, passing: 33, required: true },
            { name: "optionalSubject", label: "Optional 6th Subject", max: 100, passing: 33, required: false }
        ]
    } : boardKey === "ICSE" ? {
        totalMarks: 500,
        passingPercentage: 33,
        calculationRule: "BEST_OF_5_WITH_ENGLISH",
        fields: [
            { name: "english", label: "English (Compulsory)", max: 100, passing: 35, required: true },
            { name: "secondLanguage", label: "Second Language", max: 100, passing: 35, required: true },
            { name: "socialStudies", label: "History, Civics & Geography", max: 100, passing: 35, required: true },
            { name: "maths", label: "Mathematics", max: 100, passing: 35, required: true },
            { name: "science", label: "Science (Phy/Chem/Bio)", max: 100, passing: 35, required: true },
            { name: "elective", label: "Group 3 Elective", max: 100, passing: 35, required: true }
        ]
    } : boardKey === "STATE" ? {
        totalMarks: 625,
        passingPercentage: 33,
        passingAggregateMarks: 206,
        calculationRule: "AGGREGATE",
        fields: [
            { name: "firstLanguage", label: "First Language", max: 125, passing: 38, required: true },
            { name: "secondLanguage", label: "Second Language", max: 100, passing: 30, required: true },
            { name: "thirdLanguage", label: "Third Language", max: 100, passing: 30, required: true },
            { name: "maths", label: "Mathematics", max: 100, passing: 30, required: true },
            { name: "science", label: "Science", max: 100, passing: 30, required: true },
            { name: "socialScience", label: "Social Science", max: 100, passing: 30, required: true }
        ]
    } : null;

    if (!config) {
        return { percentage: 0, obtained: 0, max: 0, passed: false, error: "Invalid Board selected" };
    }

    // 1. Gather all numeric marks and check individual subject passing
    const subjectMarks = [];
    const missingCompulsory = [];

    for (const field of config.fields) {
        const valStr = marks[field.name];
        if (valStr === undefined || valStr === "") {
            if (field.required) {
                missingCompulsory.push(field.name);
            }
            continue;
        }

        const mark = parseFloat(valStr);
        if (isNaN(mark)) continue;

        // Enforce max validation
        if (mark > field.max) {
            passed = false;
            error = `${field.label || field.name} marks cannot exceed maximum (${field.max})`;
            return { percentage: 0, obtained: 0, max: 0, passed: false, error };
        }

        // Check individual subject pass marks
        if (mark < field.passing) {
            passed = false;
        }

        subjectMarks.push({ name: field.name, mark, max: field.max, passing: field.passing });
    }

    // If any compulsory fields are missing, we cannot calculate the final status
    if (missingCompulsory.length > 0) {
        return { percentage: 0, obtained: 0, max: 0, passed: false, error: "Please enter all required marks" };
    }

    // 2. Perform percentage calculation based on board rules
    if (config.calculationRule === "BEST_OF_5") {
        // CBSE: Best of 5 subjects out of the entered ones (could be 5 or 6)
        const sortedMarks = [...subjectMarks].sort((a, b) => b.mark - a.mark);
        const best5 = sortedMarks.slice(0, 5);
        obtained = best5.reduce((sum, item) => sum + item.mark, 0);
        max = 500;
    } 
    else if (config.calculationRule === "BEST_OF_5_WITH_ENGLISH") {
        // ICSE: English is compulsory + best of remaining 5
        const englishObj = subjectMarks.find(item => item.name === "english");
        if (!englishObj) {
            return { percentage: 0, obtained: 0, max: 0, passed: false, error: "English marks required" };
        }
        const otherSubjects = subjectMarks.filter(item => item.name !== "english");
        const sortedOthers = [...otherSubjects].sort((a, b) => b.mark - a.mark);
        const best4Others = sortedOthers.slice(0, 4);
        
        obtained = englishObj.mark + best4Others.reduce((sum, item) => sum + item.mark, 0);
        max = 500;
    } 
    else if (config.calculationRule === "AGGREGATE") {
        // STATE: Standard sum of all numeric subjects
        obtained = subjectMarks.reduce((sum, item) => sum + item.mark, 0);
        max = config.totalMarks; // 625

        // Enforce state board specific aggregate limits
        if (obtained < (config.passingAggregateMarks || 206)) {
            passed = false;
        }
    }

    const percentage = parseFloat(((obtained / max) * 100).toFixed(2));

    // Enforce aggregate passing percentage
    if (percentage < config.passingPercentage) {
        passed = false;
    }

    return {
        percentage,
        obtained,
        max,
        passed,
        error: ""
    };
};
