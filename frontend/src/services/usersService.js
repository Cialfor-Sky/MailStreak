import api from './api';

export const getCurrentProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const listUsers = async (q = '') => {
  const response = await api.get('/api/v1/users', { params: q ? { q } : {} });
  return response.data;
};

export const createUser = async ({ name, email, role, password }) => {
  const response = await api.post('/api/v1/users', { name, email, role, password });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/v1/users/${userId}`);
  return response.data;
};
