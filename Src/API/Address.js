import axios from "axios";

const BASE_URL = "https://travel.timestringssystem.com/address/getaddress"; // Replace with your backend URL if deployed

// const BASE_URL="https://travel.timestringssystem.com/address/getaddress";

export const saveAddress = async (addressData) => {
  try {
    const response = await axios.post(`${BASE_URL}/address`, addressData, {
      headers: {
        "Content-Type": "application/json",
        f,
      },
    });

    console.log(response.data);
    return response.data; // Return the response data directly
  } catch (error) {
    // Handle and throw a detailed error message
    const errorMessage =
      error.response?.data?.error || "Failed to save address";
    throw new Error(errorMessage);
  }
};
