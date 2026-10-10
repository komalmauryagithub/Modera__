/**
 * Validates whether a string is a strictly valid calendar date formatted as YYYY-MM-DD.
 * Rejects non-existent dates such as 2026-02-31 or 2026-04-31.
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isValidCalendarDate = (dateStr) => {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2200) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/**
 * Validates whether a string is a valid year-month string formatted as YYYY-MM.
 * @param {string} monthStr
 * @returns {boolean}
 */
export const isValidYearMonth = (monthStr) => {
  if (typeof monthStr !== 'string' || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return false;
  }

  const [yearStr, monthPart] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthPart, 10);

  return year >= 1900 && year <= 2200 && month >= 1 && month <= 12;
};
