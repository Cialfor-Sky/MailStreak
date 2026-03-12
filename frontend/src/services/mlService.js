import api from "./api";

export const startTraining = async (datasetSize = 2000) => {
  const response = await api.post(`/ml/train?dataset_size=${datasetSize}`);
  return response.data;
};

export const getTrainingStatus = async () => {
  const response = await api.get('/ml/train/status');
  return response.data;
};

export const getTrainingHistory = async (limit = 20) => {
  const response = await api.get(`/ml/train/history?limit=${limit}`);
  return response.data;
};

export const seedData = async () => {
  const response = await api.post('/ml/seed');
  return response.data;
};
