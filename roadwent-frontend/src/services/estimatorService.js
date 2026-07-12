import axios from 'axios';

const API_URL = '/api/estimators';

// Configure axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

// Get all estimator data for the current user
export const getAllEstimators = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching estimator data:', error);
    throw error;
  }
};

// Get a specific estimator by ID
export const getEstimatorById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching estimator:', error);
    throw error;
  }
};

// Save new estimator data
export const saveEstimator = async (estimatorData) => {
  try {
    const response = await axios.post(API_URL, estimatorData);
    return response.data;
  } catch (error) {
    console.error('Error saving estimator data:', error);
    throw error;
  }
};

// Update existing estimator data
export const updateEstimator = async (id, estimatorData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, estimatorData);
    return response.data;
  } catch (error) {
    console.error('Error updating estimator data:', error);
    throw error;
  }
};

// Delete estimator data
export const deleteEstimator = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting estimator data:', error);
    throw error;
  }
};

export default {
  getAllEstimators,
  getEstimatorById,
  saveEstimator,
  updateEstimator,
  deleteEstimator
};