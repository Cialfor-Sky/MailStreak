import api from "./api";

export const getEmails = async ({ limit = 200, offset = 0 } = {}) => {
  const response = await api.get('/emails', { params: { limit, offset } });
  return response.data;
};

export const getEmailCount = async () => {
  const response = await api.get('/emails/count');
  return response.data;
};
