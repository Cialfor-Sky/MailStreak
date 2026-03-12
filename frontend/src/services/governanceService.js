import api from './api';

export const getTrainingReviewQueue = async (status = 'PENDING_ADMIN_REVIEW') => {
  const response = await api.get('/scan-email/reviews', { params: { status, limit: 200 } });
  return response.data;
};

export const reviewTrainingSubmission = async (reviewId, decision, admin_notes = '') => {
  const response = await api.patch(`/scan-email/reviews/${reviewId}`, { decision, admin_notes });
  return response.data;
};

export const createWhitelistRequest = async (payload) => {
  const response = await api.post('/scan-email/whitelist/request', payload);
  return response.data;
};

export const listWhitelistRequests = async (status) => {
  const response = await api.get('/scan-email/whitelist/requests', { params: { status, limit: 200 } });
  return response.data;
};

export const reviewWhitelistRequest = async (requestId, decision, admin_notes = '') => {
  const response = await api.patch(`/scan-email/whitelist/requests/${requestId}`, { decision, admin_notes });
  return response.data;
};

export const directWhitelist = async ({ sender, subject, content }) => {
  const response = await api.post('/scan-email/whitelist/direct', { sender, subject, content });
  return response.data;
};

export const listSafeEmails = async () => {
  const response = await api.get('/scan-email/whitelist/safe');
  return response.data;
};

export const analyzeSafeEmail = async (safeEmailId) => {
  const response = await api.get(`/scan-email/whitelist/safe/${safeEmailId}/analyze`);
  return response.data;
};
