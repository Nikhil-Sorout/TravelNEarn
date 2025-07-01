import axios from "axios";

// Base URL for your backend API

const API_URL = "https://travel.timestringssystem.com/api/auth";

// Send OTP request
export const sendOtp = async (phoneNumber) => {
  alert(phoneNumber);
  try {
    // Parse and format the phone number to E.164 format
    // const parsedNumber = parsePhoneNumberFromString(phoneNumber, 'IN'); // Use 'IN' for India
    // if (!parsedNumber || !parsedNumber.isValid()) {
    //   throw new Error('Invalid phone number');
    // }

    // // Format the phone number to E.164
    // const formattedNumber = parsedNumber.format('E.164');
    // console.log('Formatted Phone Number:', formattedNumber); // Log the formatted phone number

    // Send the formatted number to your backend
    // const response = await axios.post(`${API_URL}/send-otp`, { phoneNumber: +91`${phoneNumber}` });
    const response = await axios.post(`${API_URL}/send-otp`, {
      phoneNumber: `${phoneNumber}`, // Properly concatenate the country code
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    alert(error);
    console.error(
      "Error sending OTP:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw the error to handle it in the calling component
  }
};

// Verify OTP request
export const verifyOtp = async (phoneNumber, otp) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      phoneNumber,
      otp,
    });
    console.log("Backend Response:", response.data); // Log the backend response
    return response.data;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

export const updateProfile = async (userId, firstName, lastName, email) => {
  try {
    const response = await axios.put(`${API_URL}/user/${userId}`, {
      firstName,
      lastName,
      email,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error updating profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};
