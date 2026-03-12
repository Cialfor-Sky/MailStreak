import api from "./api";

export const startEmailScan = async ({ emailContent, subject, metadata }) => {
  const response = await api.post('/scan-email', {
    email_content: emailContent,
    subject,
    metadata,
  });
  return response.data;
};

export const parseEmailHeaders = async (emailContent) => {
  const response = await api.post('/scan-email/parse-headers', {
    email_content: emailContent,
  });
  return response.data;
};

export const getEmailScanStatus = async (scanId) => {
  const response = await api.get(`/scan-email/${scanId}`);
  return response.data;
};

export const createScanEventSource = (scanId) => {
  const token = localStorage.getItem("access_token") || "";
  const baseURL = `http://${window.location.hostname}:8000`;
  const url = `${baseURL}/scan-email/stream/${scanId}?token=${encodeURIComponent(token)}`;
  return new EventSource(url);
};
