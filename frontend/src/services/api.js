const API_BASE_URL = "http://localhost:8080";

/**
 * Helper to make HTTP requests with JWT headers
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("careermate_token");
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If the body is not FormData, treat as JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {}
    
    throw new Error(errorDetail);
  }

  // Handle empty or 204 responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // ----------------- Auth Services -----------------
  async login(email, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("careermate_token", data.access_token);
    localStorage.setItem("careermate_user", JSON.stringify({
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role
    }));
    return data;
  },

  async register(email, password, name) {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: { email, password, name, role: "student" },
    });
    localStorage.setItem("careermate_token", data.access_token);
    localStorage.setItem("careermate_user", JSON.stringify({
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role
    }));
    return data;
  },

  logout() {
    localStorage.removeItem("careermate_token");
    localStorage.removeItem("careermate_user");
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("careermate_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem("careermate_token");
  },

  // ----------------- Profile Services -----------------
  async getProfile() {
    return request("/api/profile");
  },

  async saveProfile(profileData) {
    return request("/api/profile", {
      method: "POST",
      body: profileData,
    });
  },

  async uploadResume(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/profile/upload-resume", {
      method: "POST",
      body: formData,
    });
  },

  // ----------------- Agent Services -----------------
  async getRecommendations() {
    return request("/api/careers/recommend");
  },

  async getSkillGap(targetCareer) {
    return request("/api/careers/skill-gap", {
      method: "POST",
      body: { target_career: targetCareer },
    });
  },

  async getRoadmap(targetCareer) {
    return request("/api/careers/roadmap", {
      method: "POST",
      body: { target_career: targetCareer },
    });
  },

  // ----------------- Admin/RAG Inspect -----------------
  async getRagDocuments() {
    return request("/api/admin/rag/documents");
  },

  async getRagStatus() {
    return request("/api/admin/rag/status");
  }
};
