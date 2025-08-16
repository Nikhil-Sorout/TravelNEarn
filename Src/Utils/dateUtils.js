import moment from 'moment-timezone';

/**
 * Unified Date Utility Functions
 * This file provides consistent date handling across the entire application
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
 * Convert any date input to a standardized YYYY-MM-DD format for API requests
 * This is the main function that should be used for all API date conversions
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForAPI = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    // If already in YYYY-MM-DD format, return as is
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    // If it's a Date object, convert to YYYY-MM-DD
    if (dateInput instanceof Date) {
      return moment(dateInput).format('YYYY-MM-DD');
    }
    
    // If it's an ISO string, convert to YYYY-MM-DD
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      return moment(dateInput).format('YYYY-MM-DD');
    }
    
    // If it's in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
      const [day, month, year] = dateInput.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // For any other string format, try to parse with moment
    return moment(dateInput).format('YYYY-MM-DD');
  } catch (error) {
    console.error('Error formatting date for API:', error);
    // Return today's date as fallback
    return moment().format('YYYY-MM-DD');
  }
};

/**
 * Convert any date input to a display format (DD/MM/YYYY)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Date in DD/MM/YYYY format for display
 */
export const formatDateForDisplay = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const apiDate = formatDateForAPI(dateInput);
    const [year, month, day] = apiDate.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Convert any date input to a detailed display format (DD MMMM YYYY)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Date in DD MMMM YYYY format
 */
export const formatDateForDetailedDisplay = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    return moment(formatDateForAPI(dateInput)).format('DD MMMM YYYY');
  } catch (error) {
    console.error('Error formatting date for detailed display:', error);
    return '';
  }
};

/**
 * Create a timezone-aware date object for travel publishing
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
 * Generate an array of dates for date selection (next 100 days)
 * @param {string|Date} startDate - Starting date
 * @returns {Array} Array of dates in DD/MM/YYYY format
 */
export const generateDateArray = (startDate) => {
  const dates = [];
  const start = moment(formatDateForAPI(startDate));
  
  for (let i = 0; i < 100; i++) {
    const futureDate = start.clone().add(i, 'days');
    dates.push(formatDateForDisplay(futureDate));
  }
  
  return dates;
};

/**
 * Validate if a date is in the future
 * @param {string|Date} dateInput - Date to validate
 * @returns {boolean} True if date is in the future
 */
export const isDateInFuture = (dateInput) => {
  if (!dateInput) return false;
  
  try {
    const date = moment(formatDateForAPI(dateInput));
    return date.isAfter(moment(), 'day');
  } catch (error) {
    console.error('Error validating future date:', error);
    return false;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayDate = () => {
  return moment().format('YYYY-MM-DD');
};

/**
 * Get today's date in DD/MM/YYYY format
 * @returns {string} Today's date for display
 */
export const getTodayDateForDisplay = () => {
  return formatDateForDisplay(getTodayDate());
};

/**
 * Parse time string and return formatted time
 * @param {string} timeString - Time string (e.g., "14:30:00" or "2:30 PM")
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
export const formatTimeString = (timeString) => {
  if (!timeString) return '';
  
  try {
    // If it's already in 12-hour format, return as is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString.replace(/:\d{2}\s/, ' '); // Remove seconds if present
    }
    
    // If it's in 24-hour format, convert to 12-hour
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    }
    
    return timeString;
  } catch (error) {
    console.error('Error formatting time string:', error);
    return timeString;
  }
};

/**
 * Create a search query object with consistent date formatting
 * @param {Object} searchParams - Search parameters
 * @returns {Object} Formatted search parameters
 */
export const createSearchQuery = (searchParams) => {
  const { from, to, date, mode, phoneNumber } = searchParams;
  
  return {
    leavingLocation: from,
    goingLocation: to,
    date: formatDateForAPI(date),
    travelMode: mode,
    phoneNumber: phoneNumber,
    userTimezone: getUserTimezone(),
    timezoneOffset: getUserTimezoneOffset()
  };
};

/**
 * Create a travel publish object with consistent date formatting
 * @param {Object} travelParams - Travel parameters
 * @returns {Object} Formatted travel parameters
 */
export const createTravelPublishData = (travelParams) => {
  const {
    travelMode,
    vehicleType,
    travelmode_number,
    expectedStartTime,
    expectedEndTime,
    travelDate,
    endDate,
    phoneNumber,
    fullFrom,
    fullTo,
    stayDays,
    stayHours
  } = travelParams;
  
  return {
    travelMode: travelMode.toLowerCase(),
    vehicleType: travelMode === "roadways" ? vehicleType ?? "" : "",
    travelmode_number,
    expectedStartTime,
    expectedEndTime,
    travelDate: formatDateForAPI(travelDate),
    endDate: formatDateForAPI(endDate),
    phoneNumber,
    fullFrom,
    fullTo,
    stayDays,
    stayHours,
    userTimezone: getUserTimezone(),
    timezoneOffset: getUserTimezoneOffset()
  };
};

/**
 * Create a consignment publish object with consistent date formatting
 * @param {Object} consignmentParams - Consignment parameters
 * @returns {Object} Formatted consignment parameters
 */
export const createConsignmentPublishData = (consignmentParams) => {
  const {
    startinglocation,
    goinglocation,
    fullgoinglocation,
    fullstartinglocation,
    travelMode,
    recievername,
    recieverphone,
    Description,
    weight,
    category,
    subcategory,
    dateOfSending,
    durationAtEndPoint,
    phoneNumber,
    dimensions
  } = consignmentParams;
  
  return {
    startinglocation,
    goinglocation,
    fullgoinglocation,
    fullstartinglocation,
    travelMode,
    recievername,
    recieverphone,
    Description,
    weight,
    category,
    subcategory,
    dateOfSending: formatDateForAPI(dateOfSending),
    durationAtEndPoint,
    phoneNumber,
    dimensions,
    userTimezone: getUserTimezone(),
    timezoneOffset: getUserTimezoneOffset()
  };
};
