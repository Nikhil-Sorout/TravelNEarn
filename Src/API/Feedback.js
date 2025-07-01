import axios from "axios";

const API_URL = "https://travel.timestringssystem.com/feed/submit"; // Replace this with your backend URL

// Send feedback to backend
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await axios.post(`${API_URL}/feedback`, feedbackData);
    return response.data;
  } catch (error) {
    console.error("Error submitting feedback:", error.message);
    throw error;
  }
};

// Get all feedback from backend
export const getAllFeedback = async () => {
  try {
    const response = await axios.get(`${API_URL}/feedback`);
    return response.data;
  } catch (error) {
    console.error("Error fetching feedback:", error.message);
    throw error;
  }
};
