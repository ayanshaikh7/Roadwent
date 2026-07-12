import axios from 'axios';

// Axios baseURL is configured in AuthContext via REACT_APP_API_BASE
const API_URL = '/api/reports';

export const getAllReports = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getReportById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createReport = async (payload) => {
  const res = await axios.post(API_URL, payload);
  return res.data;
};

export const updateReport = async (id, payload) => {
  const res = await axios.put(`${API_URL}/${id}`, payload);
  return res.data;
};

export const deleteReport = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
