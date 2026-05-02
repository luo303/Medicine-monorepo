/**
 * 知识库相关 API 服务
 */
import apiClient from "./axios";

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export interface UploadResult {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

/**
 * 上传知识库文件
 * @param file 要上传的文件
 * @param onProgress 进度回调函数
 * @returns 上传结果
 */
export function uploadKnowledgeFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    // 使用 axios 上传文件
    apiClient
      .post("/knowledge/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total && onProgress) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              progress: Math.round((progressEvent.loaded / progressEvent.total) * 100)
            });
          }
        }
      })
      .then(response => {
        resolve({
          id: response.data.id || `file_${Date.now()}`,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
      })
      .catch(error => {
        reject(error);
      });
  });
}

/**
 * 获取知识库文件列表
 * @returns 文件列表
 */
export async function getKnowledgeFiles(): Promise<KnowledgeFile[]> {
  const response = await apiClient.get("/knowledge/files");
  return response.data.files || [];
}

/**
 * 删除知识库文件
 * @param fileId 文件 ID
 */
export async function deleteKnowledgeFile(fileId: string): Promise<void> {
  await apiClient.delete(`/knowledge/files/${fileId}`);
}

/**
 * 清空知识库
 */
export async function clearKnowledgeFiles(): Promise<void> {
  await apiClient.post("/knowledge/clear");
}
