import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 120000,  // 2 minutes for LLM responses
});

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await API.post('/upload', formData);
  return res.data;
};

export const sendChatMessage = async (question) => {
  const res = await API.post('/chat', { question });
  return res.data;
};

export const getMedicalSummary = async () => {
  const res = await API.get('/summary');
  return res.data;
};

export const getSources = async (query) => {
  const res = await API.get('/sources', { params: { query } });
  return res.data;
};

export const getHealth = async () => {
  const res = await API.get('/health');
  return res.data;
};

export const getSuggestedQuestions = async () => {
  const res = await API.get('/questions');
  return res.data;
};
