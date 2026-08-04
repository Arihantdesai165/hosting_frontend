/**
 * Returns the current academic year dynamically in "YYYY-YYYY" format.
 * Defaults to current date calculation, or formats a provided year string.
 */
export const getAcademicYear = (customYear?: string): string => {
  if (customYear) return customYear;
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 5 = June
  if (month >= 5) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Returns current calendar year automatically from system date for copyright notices.
 */
export const getCopyrightYear = (): number => {
  return new Date().getFullYear();
};
