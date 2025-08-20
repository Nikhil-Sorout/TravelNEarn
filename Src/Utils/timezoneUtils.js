import moment from 'moment-timezone';

/**
 * Timezone utility functions for handling dates across different timezones
 */

/**
 * Get the user's current timezone
 * @returns {string} Timezone string (e.g., 'Asia/Kolkata', 'America/New_York')
 */
export const getUserTimezone = () => {
  // For React Native, we can use moment-timezone to detect the timezone
  return moment.tz.guess();
};

/**
 * Get the user's timezone offset in minutes
 * @returns {number} Timezone offset in minutes
 */
export const getUserTimezoneOffset = () => {
  return new Date().getTimezoneOffset();
};

/**
 * Convert a local date to UTC while preserving the intended local date
 * This prevents the date from shifting due to timezone conversion
 * @param {Date} localDate - The local date object
 * @returns {string} UTC date string in YYYY-MM-DD format
 */
export const localDateToUTC = (localDate) => {
  if (!localDate) return null;
  
  // Create a date object in the user's local timezone
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const day = localDate.getDate();
  
  // Create UTC date to avoid timezone shifts
  const utcDate = new Date(Date.UTC(year, month, day));
  
  // Format as YYYY-MM-DD
  return utcDate.toISOString().split('T')[0];
};

/**
 * Convert a UTC date string back to a local date object
 * @param {string} utcDateString - UTC date string in YYYY-MM-DD format
 * @returns {Date} Local date object
 */
export const utcToLocalDate = (utcDateString) => {
  if (!utcDateString) return new Date();
  
  // Parse the UTC date string
  const [year, month, day] = utcDateString.split('-').map(Number);
  
  // Create a date in the user's local timezone
  return new Date(year, month - 1, day);
};

/**
 * Format a date for display in the user's local timezone
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Moment.js format string (default: 'DD MMMM YYYY')
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateInput, format = 'DD MMMM YYYY') => {
  if (!dateInput) return '';
  
  let momentDate;
  
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      // ISO string format
      momentDate = moment(dateInput);
    } else if (dateInput.includes('-')) {
      // YYYY-MM-DD format - treat as local date
      const [year, month, day] = dateInput.split('-').map(Number);
      momentDate = moment([year, month - 1, day]);
    } else {
      // Other string format
      momentDate = moment(dateInput);
    }
  } else if (dateInput instanceof Date) {
    momentDate = moment(dateInput);
  } else {
    return '';
  }
  
  return momentDate.format(format);
};

/**
 * Format a UTC date for display while preserving the original date
 * This prevents timezone conversion from shifting the date
 * @param {string|Date} dateInput - UTC date string or Date object
 * @param {string} format - Moment.js format string (default: 'DD MMMM YYYY')
 * @returns {string} Formatted date string
 */
export const formatUTCDateForDisplay = (dateInput, format = 'DD MMMM YYYY') => {
  if (!dateInput) return '';
  
  let momentDate;
  
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      // Parse as UTC timestamp and convert to local timezone
      momentDate = moment.utc(dateInput).local();
    } else if (dateInput.includes('-')) {
      // YYYY-MM-DD format - treat as local date
      const [year, month, day] = dateInput.split('-').map(Number);
      momentDate = moment([year, month - 1, day]);
    } else {
      // Other string format
      momentDate = moment(dateInput);
    }
  } else if (dateInput instanceof Date) {
    // Convert Date object to moment and handle as UTC
    momentDate = moment.utc(dateInput).local();
  } else {
    return '';
  }
  
  return momentDate.format(format);
};

/**
 * Create a timezone-aware date object for API requests
 * @param {Date} localDate - Local date object
 * @param {string} time - Time string (e.g., "2:30 PM")
 * @returns {Object} Object with date and timezone information
 */
export const createTimezoneAwareDate = (localDate, time = null) => {
  if (!localDate) return null;
  
  const timezone = getUserTimezone();
  const timezoneOffset = getUserTimezoneOffset();
  
  // Create the base date
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const day = localDate.getDate();
  
  let momentDate = moment([year, month, day]);
  
  // If time is provided, add it to the date
  if (time) {
    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = parseInt(timeMatch[2], 10);
      const period = timeMatch[3].toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      momentDate = momentDate.hour(hour).minute(minute);
    }
  }
  
  return {
    date: momentDate.format('YYYY-MM-DD'),
    time: time,
    timezone: timezone,
    timezoneOffset: timezoneOffset,
    utcDate: momentDate.utc().format('YYYY-MM-DD'),
    utcDateTime: momentDate.utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
  };
};

/**
 * Validate if a date and time combination is in the future
 * @param {Date} date - Date object
 * @param {string} time - Time string (e.g., "2:30 PM")
 * @returns {boolean} True if the date/time is in the future
 */
export const isDateTimeInFuture = (date, time = null) => {
  if (!date) return false;
  
  const now = moment();
  let targetDateTime = moment(date);
  
  if (time) {
    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = parseInt(timeMatch[2], 10);
      const period = timeMatch[3].toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      targetDateTime = targetDateTime.hour(hour).minute(minute);
    }
  }
  
  return targetDateTime.isAfter(now);
};

/**
 * Get a user-friendly timezone display string
 * @returns {string} Timezone display string (e.g., "IST (UTC+5:30)")
 */
export const getTimezoneDisplay = () => {
  const timezone = getUserTimezone();
  const offset = getUserTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const sign = offset <= 0 ? '+' : '-';
  
  // Common timezone abbreviations
  const timezoneAbbr = {
    'Asia/Kolkata': 'IST',
    'America/New_York': 'EST/EDT',
    'America/Los_Angeles': 'PST/PDT',
    'Europe/London': 'GMT/BST',
    'Europe/Paris': 'CET/CEST',
    'Asia/Tokyo': 'JST',
    'Australia/Sydney': 'AEST/AEDT'
  };
  
  const abbr = timezoneAbbr[timezone] || timezone.split('/').pop();
  
  return `${abbr} (UTC${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')})`;
};

/**
 * Convert between different date formats while preserving timezone awareness
 * @param {string|Date} dateInput - Input date
 * @param {string} targetFormat - Target format ('local', 'utc', 'iso', 'display')
 * @returns {string} Formatted date string
 */
export const convertDateFormat = (dateInput, targetFormat = 'local') => {
  if (!dateInput) return '';
  
  let momentDate;
  
  // Parse input date
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      momentDate = moment(dateInput);
    } else if (dateInput.includes('-')) {
      const [year, month, day] = dateInput.split('-').map(Number);
      momentDate = moment([year, month - 1, day]);
    } else {
      momentDate = moment(dateInput);
    }
  } else if (dateInput instanceof Date) {
    momentDate = moment(dateInput);
  } else {
    return '';
  }
  
  // Convert to target format
  switch (targetFormat) {
    case 'local':
      return momentDate.format('YYYY-MM-DD');
    case 'utc':
      return momentDate.utc().format('YYYY-MM-DD');
    case 'iso':
      return momentDate.toISOString();
    case 'display':
      return momentDate.format('DD MMMM YYYY');
    default:
      return momentDate.format('YYYY-MM-DD');
  }
};
