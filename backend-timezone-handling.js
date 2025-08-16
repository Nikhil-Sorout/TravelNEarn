// Backend timezone handling utilities (Node.js/Express)

const moment = require('moment-timezone');

/**
 * Parse timezone-aware travel data from frontend
 * @param {Object} travelData - Data from frontend
 * @returns {Object} Processed travel data with proper dates
 */
function parseTimezoneAwareTravelData(travelData) {
  const {
    travelDate,
    endDate,
    expectedStartTime,
    expectedEndTime,
    userTimezone,
    timezoneOffset,
    ...otherData
  } = travelData;

  // Get user's timezone (fallback to UTC if not provided)
  const userTz = userTimezone || 'UTC';
  
  // Parse the travel date (should be in YYYY-MM-DD format from frontend)
  let parsedTravelDate;
  if (typeof travelDate === 'string' && travelDate.includes('-')) {
    // YYYY-MM-DD format - treat as local date in user's timezone
    const [year, month, day] = travelDate.split('-').map(Number);
    parsedTravelDate = moment.tz([year, month - 1, day], userTz);
  } else {
    // Fallback for other formats
    parsedTravelDate = moment.tz(travelDate, userTz);
  }

  // Parse the end date
  let parsedEndDate;
  if (typeof endDate === 'string' && endDate.includes('-')) {
    const [year, month, day] = endDate.split('-').map(Number);
    parsedEndDate = moment.tz([year, month - 1, day], userTz);
  } else {
    parsedEndDate = moment.tz(endDate, userTz);
  }

  // Parse start and end times
  const startTime = parseTimeString(expectedStartTime, parsedTravelDate, userTz);
  const endTime = parseTimeString(expectedEndTime, parsedEndDate, userTz);

  return {
    ...otherData,
    travelDate: parsedTravelDate.toDate(), // Store as Date object
    endDate: parsedEndDate.toDate(), // Store as Date object
    expectedStartTime: startTime.toDate(), // Store as Date object
    expectedEndTime: endTime.toDate(), // Store as Date object
    userTimezone: userTz, // Store timezone for future reference
    timezoneOffset: timezoneOffset || moment.tz(userTz).utcOffset(), // Store offset
    // Add additional fields for easier querying
    travelDateLocal: parsedTravelDate.format('YYYY-MM-DD'),
    endDateLocal: parsedEndDate.format('YYYY-MM-DD'),
    expectedStartTimeLocal: startTime.format('YYYY-MM-DD HH:mm:ss'),
    expectedEndTimeLocal: endTime.format('YYYY-MM-DD HH:mm:ss'),
  };
}

/**
 * Parse time string and combine with date in user's timezone
 * @param {string} timeStr - Time string like "6:01 am"
 * @param {moment} date - Date object
 * @param {string} timezone - User's timezone
 * @returns {moment} Combined date-time in user's timezone
 */
function parseTimeString(timeStr, date, timezone) {
  if (!timeStr) return date;

  // Parse time string (e.g., "6:01 am", "10:30 am")
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return date.clone().hour(hour).minute(minute).second(0).millisecond(0);
  }

  // If time is already in ISO format, parse it
  if (timeStr.includes('T')) {
    return moment.tz(timeStr, timezone);
  }

  return date;
}

/**
 * Format dates for display in user's timezone
 * @param {Date} date - Date object from database
 * @param {string} userTimezone - User's timezone
 * @param {string} format - Display format
 * @returns {string} Formatted date string
 */
function formatDateForDisplay(date, userTimezone, format = 'DD MMMM YYYY') {
  if (!date) return '';
  return moment.tz(date, userTimezone).format(format);
}

/**
 * Format time for display in user's timezone
 * @param {Date} date - Date object from database
 * @param {string} userTimezone - User's timezone
 * @returns {string} Formatted time string
 */
function formatTimeForDisplay(date, userTimezone) {
  if (!date) return '';
  return moment.tz(date, userTimezone).format('h:mm A');
}

/**
 * Get travel data formatted for frontend display
 * @param {Object} travelRecord - Travel record from database
 * @param {string} userTimezone - User's timezone
 * @returns {Object} Formatted travel data
 */
function formatTravelDataForFrontend(travelRecord, userTimezone) {
  const {
    travelDate,
    endDate,
    expectedStartTime,
    expectedEndTime,
    userTimezone: storedTimezone,
    ...otherData
  } = travelRecord;

  // Use stored timezone or provided timezone
  const tz = storedTimezone || userTimezone || 'UTC';

  return {
    ...otherData,
    travelDate: formatDateForDisplay(travelDate, tz),
    endDate: formatDateForDisplay(endDate, tz),
    expectedStartTime: formatTimeForDisplay(expectedStartTime, tz),
    expectedEndTime: formatTimeForDisplay(expectedEndTime, tz),
    travelDateISO: moment.tz(travelDate, tz).toISOString(),
    endDateISO: moment.tz(endDate, tz).toISOString(),
    expectedStartTimeISO: moment.tz(expectedStartTime, tz).toISOString(),
    expectedEndTimeISO: moment.tz(expectedEndTime, tz).toISOString(),
    userTimezone: tz,
  };
}

/**
 * Query travels by date range in user's timezone
 * @param {Date} startDate - Start date in user's timezone
 * @param {Date} endDate - End date in user's timezone
 * @param {string} userTimezone - User's timezone
 * @returns {Object} MongoDB query object
 */
function createDateRangeQuery(startDate, endDate, userTimezone) {
  const tz = userTimezone || 'UTC';
  
  // Convert local dates to UTC for database query
  const startUTC = moment.tz(startDate, tz).startOf('day').utc().toDate();
  const endUTC = moment.tz(endDate, tz).endOf('day').utc().toDate();

  return {
    travelDate: {
      $gte: startUTC,
      $lte: endUTC
    }
  };
}

module.exports = {
  parseTimezoneAwareTravelData,
  formatDateForDisplay,
  formatTimeForDisplay,
  formatTravelDataForFrontend,
  createDateRangeQuery,
};
