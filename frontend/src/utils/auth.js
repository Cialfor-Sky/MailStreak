/**
 * Utility to decode JWT tokens and extract user information.
 */

export const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const getCurrentUser = () => {
  const token = getAuthToken();
  const decoded = decodeToken(token);
  if (!decoded) return null;

  // Check expiration
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    localStorage.removeItem("access_token");
    return null;
  }

  return {
    email: decoded.email,
    role: decoded.role || "USER",
    name: decoded.name || decoded.email?.split("@")?.[0] || "User",
    id: decoded.sub,
  };
};

export const formatRole = (role) => {
  if (!role) return "User";
  const roles = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    USER: "User",
    super_admin: "Super Admin",
    admin: "Admin",
    user: "User",
  };
  return roles[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

export const logout = () => {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
};
