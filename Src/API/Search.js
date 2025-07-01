// import axios from 'axios';

// const API_BASE_URL = 'https://swiftmed.in/t/get'; // Replace with your backend URL

// // Get All Travel Details
// export const getAllTravelDetails = async () => {
//   try {
//     const response = await axios.get(API_BASE_URL);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching travel details:', error);
//     throw error;
//   }
// };

// // Get Travel Detail by ID
// export const getTravelDetailById = async (id) => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching travel detail by ID:', error);
//     throw error;
//   }
// };

// // Create a New Travel Detail
// export const createTravelDetail = async (travelDetail) => {
//   try {
//     const response = await axios.post(API_BASE_URL, travelDetail);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating travel detail:', error);
//     throw error;
//   }
// };

// // Update Travel Detail
// export const updateTravelDetail = async (id, updatedDetail) => {
//   try {
//     const response = await axios.put(`${API_BASE_URL}/${id}`, updatedDetail);
//     return response.data;
//   } catch (error) {
//     console.error('Error updating travel detail:', error);
//     throw error;
//   }
// };

// // Delete Travel Detail
// export const deleteTravelDetail = async (id) => {
//   try {
//     const response = await axios.delete(`${API_BASE_URL}/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error deleting travel detail:', error);
//     throw error;
//   }
// };

// import axios from 'axios';

// const API_BASE_URL = 'https://swiftmed.in/t/get'; // Replace with your backend URL

// // Get All Travel Details
// export const getAllTravelDetails = async () => {
//   try {
//     const response = await axios.get(API_BASE_URL);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching travel details:', error);
//     throw error;
//   }
// };

// // Get Travel Detail by ID
// export const getTravelDetailById = async (id) => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching travel detail by ID:', error);
//     throw error;
//   }
// };

// // Create a New Travel Detail
// export const createTravelDetail = async (travelDetail) => {
//   try {
//     const response = await axios.post(API_BASE_URL, travelDetail);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating travel detail:', error);
//     throw error;
//   }
// };

// // Update Travel Detail
// export const updateTravelDetail = async (id, updatedDetail) => {
//   try {
//     const response = await axios.put(`${API_BASE_URL}/${id}`, updatedDetail);
//     return response.data;
//   } catch (error) {
//     console.error('Error updating travel detail:', error);
//     throw error;
//   }
// };

// // Delete Travel Detail
// export const deleteTravelDetail = async (id) => {
//   try {
//     const response = await axios.delete(`${API_BASE_URL}/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error deleting travel detail:', error);
//     throw error;
//   }
// };
import axios from "axios";

const API_BASE_URL = "https://travel.timestringssystem.com/t/get/search-rides"; // Replace with your backend URL

// Get All s
export const getAllTravelDetails = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching travel details:", error);
    throw error;
  }
};

// Get Travel Detail by ID
export const getTravelDetailById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching travel detail by ID:", error);
    throw error;
  }
};

// Create a New Travel Detail
export const createTravelDetail = async (travelDetail) => {
  try {
    const response = await axios.post(API_BASE_URL, travelDetail);
    return response.data;
  } catch (error) {
    console.error("Error creating travel detail:", error);
    throw error;
  }
};

// Update Travel Detail
export const updateTravelDetail = async (id, updatedDetail) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, updatedDetail);
    return response.data;
  } catch (error) {
    console.error("Error updating travel detail:", error);
    throw error;
  }
};

// Delete Travel Detail
export const deleteTravelDetail = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting travel detail:", error);
    throw error;
  }
};
