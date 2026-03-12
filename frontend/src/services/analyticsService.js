import api from './api';

export const getAnalyticsData = async () => {
  try {
    const response = await api.get('/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

export const getExecutiveAnalyticsData = async () => {
  try {
    const response = await api.get('/analytics/executive');
    return response.data;
  } catch (error) {
    console.error('Error fetching executive analytics data:', error);
    throw error;
  }
};
