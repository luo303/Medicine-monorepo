import apiClient from "./axios";

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  chunks: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export interface UploadResult {
  success: boolean;
  chunks: number;
  filename: string;
}

interface KnowledgeUploadResponse {
  success: boolean;
  message: string;
  data?: UploadResult;
}

interface KnowledgeFileResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  chunks: number;
  uploadTime: string;
}

interface KnowledgeFileListResponse {
  success: boolean;
  data: KnowledgeFileResponse[];
  message: string;
}

interface KnowledgeClearResponse {
  success: boolean;
  message: string;
  data: null;
}

export function uploadKnowledgeFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    apiClient
      .post<KnowledgeUploadResponse>("/knowledge/upload", formData, {
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
        if (!response.data.data?.success || !response.data.data) {
          reject(new Error(response.data.message || "Upload failed"));
          return;
        }

        resolve(response.data.data);
      })
      .catch(error => {
        reject(error);
      });
  });
}

export async function getKnowledgeFiles(): Promise<KnowledgeFile[]> {
  const response = await apiClient.get<KnowledgeFileListResponse>("/knowledge/files");
  return (response.data.data || []).map(file => ({
    id: file.id,
    name: file.originalName || file.filename,
    size: file.size,
    uploadedAt: file.uploadTime,
    chunks: file.chunks
  }));
}

export async function deleteKnowledgeFile(): Promise<void> {
  throw new Error("Delete knowledge file endpoint is not available");
}

export async function clearKnowledgeFiles(): Promise<void> {
  const response = await apiClient.post<KnowledgeClearResponse>("/knowledge/clear");

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to clear knowledge base");
  }
}
