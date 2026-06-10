import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// Auth helpers (admin token)
export const getAdminToken = () => localStorage.getItem("mmgh_admin_token") || "";
export const setAdminToken = (t) => localStorage.setItem("mmgh_admin_token", t);
export const clearAdminToken = () => localStorage.removeItem("mmgh_admin_token");

// Player session
export const getSession = () => {
  try { return JSON.parse(localStorage.getItem("mmgh_session") || "null"); }
  catch { return null; }
};
export const setSession = (s) => localStorage.setItem("mmgh_session", JSON.stringify(s));
export const clearSession = () => localStorage.removeItem("mmgh_session");

// API calls
export const registerPlayer = (name, email) =>
  api.post("/players/register", { name, email }).then(r => r.data);

export const fetchMatches = () => api.get("/matches").then(r => r.data);
export const fetchMe = (email) => api.get("/players/me", { params: { email } }).then(r => r.data);
export const fetchStats = () => api.get("/stats").then(r => r.data);

export const savePredictions = (email, predictions) =>
  api.post("/predictions", { email, predictions }).then(r => r.data);

export const adminLogin = (password) =>
  api.post("/admin/login", { password }).then(r => r.data);

const adminHeaders = () => ({ Authorization: `Bearer ${getAdminToken()}` });

export const adminSetResult = (payload) =>
  api.post("/admin/result", payload, { headers: adminHeaders() }).then(r => r.data);

export const adminGetLeaderboard = () =>
  api.get("/admin/leaderboard", { headers: adminHeaders() }).then(r => r.data);

export const adminGetPlayers = () =>
  api.get("/admin/players", { headers: adminHeaders() }).then(r => r.data);

export const adminDeletePlayer = (email) =>
  api.delete(`/admin/player/${encodeURIComponent(email)}`, { headers: adminHeaders() }).then(r => r.data);
