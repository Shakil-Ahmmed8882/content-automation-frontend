import { ofetch } from "ofetch";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// The backend authenticates with httpOnly cookies, so every request must carry them.
const apiClient = ofetch.create({
  baseURL: BASE_URL,
  credentials: "include",
});

export default apiClient;
