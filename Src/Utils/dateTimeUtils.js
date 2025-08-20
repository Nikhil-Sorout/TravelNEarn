import moment from 'moment-timezone';

/**
 * Centralized Date/Time Utility Functions
 * Provides consistent date/time formatting across the entire app
 */

/**
 * Get the user's current timezone
 * @returns {string} Timezone string (e.g., 'Asia/Kolkata', 'America/New_York')
 */
export const getUserTimezone = () => {
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
 * Format a date for display while preserving the original date from UTC timestamps
 * This prevents timezone conversion from shifting the date
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Moment.js format string (default: 'DD MMMM YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, format = 'DD MMMM YYYY') => {
  if (!dateInput) return '';
  
  let momentDate;
  
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      // Parse as UTC timestamp and convert to local timezone
      // This ensures the date is displayed according to local timezone
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
 * Format a time for display while preserving the original time from UTC timestamps
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Moment.js format string (default: 'hh:mm A')
 * @returns {string} Formatted time string
 */
export const formatTime = (dateInput, format = 'hh:mm A') => {
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
 * Format date and time together
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} dateFormat - Date format (default: 'DD MMMM YYYY')
 * @param {string} timeFormat - Time format (default: 'hh:mm A')
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateInput, dateFormat = 'DD MMMM YYYY', timeFormat = 'hh:mm A') => {
  const date = formatDate(dateInput, dateFormat);
  const time = formatTime(dateInput, timeFormat);
  return `${date} ${time}`;
};

/**
 * Format date with weekday
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Moment.js format string (default: 'dddd, DD MMMM YYYY')
 * @returns {string} Formatted date with weekday
 */
export const formatDateWithWeekday = (dateInput, format = 'dddd, DD MMMM YYYY') => {
  return formatDate(dateInput, format);
};

/**
 * Format time in 12-hour format
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export const formatTime12Hour = (dateInput) => {
  return formatTime(dateInput, 'hh:mm A');
};

/**
 * Format time in 24-hour format
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Time in 24-hour format (e.g., "14:30")
 */
export const formatTime24Hour = (dateInput) => {
  return formatTime(dateInput, 'HH:mm');
};

/**
 * Format date in short format
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Short date format (e.g., "16 Aug 2025")
 */
export const formatDateShort = (dateInput) => {
  return formatDate(dateInput, 'DD MMM YYYY');
};

/**
 * Format date in numeric format
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Numeric date format (e.g., "16/08/2025")
 */
export const formatDateNumeric = (dateInput) => {
  return formatDate(dateInput, 'DD/MM/YYYY');
};

/**
 * Format current time
 * @param {string} format - Moment.js format string (default: 'hh:mm A')
 * @returns {string} Current time formatted
 */
export const formatCurrentTime = (format = 'hh:mm A') => {
  return moment().format(format);
};

/**
 * Format current date
 * @param {string} format - Moment.js format string (default: 'DD MMMM YYYY')
 * @returns {string} Current date formatted
 */
export const formatCurrentDate = (format = 'DD MMMM YYYY') => {
  return moment().format(format);
};

/**
 * Check if a date is today
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {boolean} True if the date is today
 */
export const isToday = (dateInput) => {
  if (!dateInput) return false;
  
  const inputDate = formatDate(dateInput, 'YYYY-MM-DD');
  const today = moment().format('YYYY-MM-DD');
  
  return inputDate === today;
};

/**
 * Check if a date is in the future
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {boolean} True if the date is in the future
 */
export const isFutureDate = (dateInput) => {
  if (!dateInput) return false;
  
  let momentDate;
  
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      momentDate = moment.utc(dateInput).local();
    } else {
      momentDate = moment(dateInput);
    }
  } else if (dateInput instanceof Date) {
    momentDate = moment.utc(dateInput).local();
  } else {
    return false;
  }
  
  return momentDate.isAfter(moment(), 'day');
};

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  
  let momentDate;
  
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) {
      momentDate = moment.utc(dateInput).local();
    } else {
      momentDate = moment(dateInput);
    }
  } else if (dateInput instanceof Date) {
    momentDate = moment.utc(dateInput).local();
  } else {
    return '';
  }
  
  return momentDate.fromNow();
};

/**
 * Get timezone display string
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
 * Format UTC time string to local timezone for display
 * @param {string} dateTimeString - UTC date time string (e.g., "2025-08-30T19:45:00.000Z")
 * @param {string} format - Format type: "HH:mm" (24-hour), "h:mm A" (12-hour), or moment format
 * @returns {string} Formatted time string in local timezone
 */
export const formatUTCTimeToLocal = (dateTimeString, format = "HH:mm") => {
  if (!dateTimeString) return "N/A";
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "N/A";
    
    if (format === "HH:mm") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (format === "h:mm A") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return moment(date).format(format);
    }
  } catch (error) {
    console.error("Error formatting UTC time to local:", error);
    return "N/A";
  }
};

/**
 * Format UTC date string to local timezone for display
 * @param {string} dateTimeString - UTC date time string (e.g., "2025-08-30T19:45:00.000Z")
 * @param {string} format - Moment.js format string (default: "DD MMM YYYY")
 * @returns {string} Formatted date string in local timezone
 */
export const formatUTCDateToLocal = (dateTimeString, format = "DD MMM YYYY") => {
  if (!dateTimeString) return "N/A";
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "N/A";
    
    return moment(date).format(format);
  } catch (error) {
    console.error("Error formatting UTC date to local:", error);
    return "N/A";
  }
};

/**
 * Calculate duration between two UTC time strings
 * @param {string} startTime - Start time UTC string
 * @param {string} endTime - End time UTC string
 * @returns {string} Duration string (e.g., "2hr 30min")
 */
export const calculateDurationFromUTC = (startTime, endTime) => {
  if (!startTime || !endTime) return "N/A";
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
    
    const diffMs = end - start;
    if (diffMs < 0) return "N/A"; // End time before start time
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}hr`;
    } else {
      return `${hours}hr ${minutes}min`;
    }
  } catch (error) {
    console.error("Error calculating duration from UTC:", error);
    return "N/A";
  }
};

// Legacy function names for backward compatibility
export const formatDateForDisplay = formatDate;
export const formatUTCDateForDisplay = formatDate;

