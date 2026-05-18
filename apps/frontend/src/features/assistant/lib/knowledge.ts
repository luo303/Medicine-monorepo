import apiClient from "./axios";

export type KnowledgeVisibility = "private" | "public";

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
  uploadedAt: string;
  chunks: number;
  visibility: KnowledgeVisibility;
  ownerUsername: string;
  isOwner: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export interface UploadResult {
  id: string;
  chunks: number;
  filename: string;
  visibility: KnowledgeVisibility;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

interface KnowledgeFileResponse {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
  uploadedAt: string;
  chunks: number;
  visibility: KnowledgeVisibility;
  ownerUsername: string;
  isOwner: boolean;
}

interface DeleteManyResponse {
  deletedCount: number;
}

export function uploadKnowledgeFile(
  file: File,
  visibility: KnowledgeVisibility,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", visibility);

    apiClient
      .post<ApiResponse<UploadResult>>("/knowledge/upload", formData, {
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
        if (!response.data.data) {
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
  const response = await apiClient.get<ApiResponse<KnowledgeFileResponse[]>>("/knowledge/files");

  return (response.data.data || []).map(file => ({
    id: file.id,
    name: file.name,
    size: Number(file.size),
    mimeType: file.mimeType,
    uploadedAt: file.uploadedAt,
    chunks: file.chunks,
    visibility: file.visibility,
    ownerUsername: file.ownerUsername,
    isOwner: file.isOwner
  }));
}

export async function deleteKnowledgeFile(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`/knowledge/files/${id}`);
}

export async function clearKnowledgeFiles(visibility?: KnowledgeVisibility): Promise<number> {
  const response = await apiClient.delete<ApiResponse<DeleteManyResponse>>("/knowledge/files", {
    params: visibility ? { visibility } : undefined
  });

  return response.data.data?.deletedCount ?? 0;
}
