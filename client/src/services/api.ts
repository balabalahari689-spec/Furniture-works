const PORT = 5000;
export const API_URL = `http://localhost:${PORT}/api`;
export const WS_URL = `ws://localhost:${PORT}`;

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customOptions } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const token = localStorage.getItem("svs_token");

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: customOptions.method || "GET",
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customOptions,
  };

  if (customOptions.body && typeof customOptions.body === "object") {
    config.body = JSON.stringify(customOptions.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "POST", body }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "PUT", body }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
