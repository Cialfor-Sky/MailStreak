import api from './api';

export const requestGdprAction = async ({ action, password, confirmAction }) => {
  const response = await api.post('/api/v1/gdpr/delete-request', {
    action,
    password,
    confirmAction,
  });
  return response.data;
};

export const exportGdprData = async () => {
  const response = await api.get('/api/v1/gdpr/export', { responseType: 'blob' });
  return response;
};
