// Cliente HTTP compartido; añade el JWT cuando existe una sesión iniciada.
import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
