export const BOARD_CONFIG = {
  CBSE: {
    name: "CBSE",
    description: "Best of 5 subjects",
    totalMarks: 500,
    passingPercentage: 33,
    calculationRule: "BEST_OF_5",
    fields: [
      { name: "english", label: "English", type: "number", max: 100, min: 0, passing: 33, required: true },
      { name: "secondLanguage", label: "Second Language", type: "number", max: 100, min: 0, passing: 33, required: true },
      { name: "maths", label: "Mathematics", type: "number", max: 100, min: 0, passing: 33, required: true },
      { name: "science", label: "Science", type: "number", max: 100, min: 0, passing: 33, required: true },
      { name: "socialScience", label: "Social Science", type: "number", max: 100, min: 0, passing: 33, required: true },
      { name: "optionalSubject", label: "Optional 6th Subject", type: "number", max: 100, min: 0, passing: 33, required: false }
    ]
  },
  ICSE: {
    name: "ICSE",
    description: "English compulsory + best of 5",
    totalMarks: 500,
    passingPercentage: 33,
    calculationRule: "BEST_OF_5_WITH_ENGLISH",
    fields: [
      { name: "english", label: "English (Compulsory)", type: "number", max: 100, min: 0, passing: 35, required: true },
      { name: "secondLanguage", label: "Second Language", type: "number", max: 100, min: 0, passing: 35, required: true },
      { name: "socialStudies", label: "History, Civics & Geography", type: "number", max: 100, min: 0, passing: 35, required: true },
      { name: "maths", label: "Mathematics", type: "number", max: 100, min: 0, passing: 35, required: true },
      { name: "science", label: "Science (Phy/Chem/Bio)", type: "number", max: 100, min: 0, passing: 35, required: true },
      { name: "elective", label: "Group 3 Elective", type: "number", max: 100, min: 0, passing: 35, required: true }
    ]
  },
  STATE: {
    name: "STATE",
    description: "Subject-wise marks out of 625",
    totalMarks: 625,
    passingPercentage: 33,
    calculationRule: "AGGREGATE",
    passingAggregateMarks: 206,
    fields: [
      { name: "firstLanguage", label: "First Language", type: "number", max: 125, min: 0, passing: 38, required: true },
      { name: "secondLanguage", label: "Second Language", type: "number", max: 100, min: 0, passing: 30, required: true },
      { name: "thirdLanguage", label: "Third Language", type: "number", max: 100, min: 0, passing: 30, required: true },
      { name: "maths", label: "Mathematics", type: "number", max: 100, min: 0, passing: 30, required: true },
      { name: "science", label: "Science", type: "number", max: 100, min: 0, passing: 30, required: true },
      { name: "socialScience", label: "Social Science", type: "number", max: 100, min: 0, passing: 30, required: true }
    ]
  }
};
