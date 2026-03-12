import axios from "axios";

const getBaseURL = () => {
  const { hostname, protocol } = window.location;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:8000`;
  }
  
  // Specific hosted platform detection (e.g. builtwithrocket.new)
  if (hostname.includes('builtwithrocket.new')) {
    if (hostname.includes('back')) {
      return `https://${hostname}`;
    }
    // Platform usually maps front-office to back-office via subdomain swap
    const backHost = hostname.includes('front') 
      ? hostname.replace('front', 'back') 
      : hostname.replace(hostname.split('.')[0], hostname.split('.')[0] + 'back');
    const url = `https://${backHost}`;
    console.log(`[API] chose baseURL (Rocket): ${url}`);
    return url;
  }

  // Fallback to same host, port 8000 (standard for many dev setups)
  const url = `${protocol}//${hostname}:8000`;
  console.log(`[API] chose baseURL (fallback): ${url}`);
  return url;
};

const baseURL = getBaseURL();
console.log(`[API] Initialized with baseURL: ${baseURL}`);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect to login on auth failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication failed, redirecting to login...');
      localStorage.removeItem("access_token");
      // Check if not already on login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
