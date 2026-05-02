/**
 * Axios 实例配置
 */
import axios from "axios";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * 创建 axios 实例
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

/**
 * 处理 401 未授权响应
 */
function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器 - 统一处理错误
 */
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const status = error.response?.status;

    if (status === 401) {
      handleUnauthorized();
    } else if (!status && error.message === "Network Error") {
      console.error("网络连接失败，请检查服务是否正常运行");
    } else if (status >= 500) {
      console.error(`服务器错误 (${status})`);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
