import api from "./api";

export const login = async (email, password) => {
  const res = await api.post('/auth/login', {
    email,
    password,
  });

  localStorage.setItem("access_token", res.data.access_token);
  return res.data;
};

export const changePassword = async ({ oldPassword, newPassword, confirmPassword }) => {
  const res = await api.post('/auth/change-password', {
    oldPassword,
    newPassword,
    confirmPassword,
  });
  return res.data;
};
