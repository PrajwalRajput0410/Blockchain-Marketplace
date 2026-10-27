import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error.response?.data;
  if (data && typeof data === "object" && !(data instanceof Blob) && data.message) {
    return data.message;
  }
  return error.message || fallback;
}

async function messageFromBlob(blob) {
  try {
    const text = await blob.text();
    const json = JSON.parse(text);
    return json.message;
  } catch {
    return null;
  }
}

export async function downloadDataset(id, fileName) {
  try {
    const response = await api.get(`/datasets/${id}/download`, {
      responseType: "blob",
    });
    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      const message = await messageFromBlob(response.data);
      throw new Error(message || "Download failed.");
    }
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName || "dataset");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const message = await messageFromBlob(error.response.data);
      throw new Error(message || getErrorMessage(error, "Download failed."));
    }
    throw error;
  }
}

export default api;
