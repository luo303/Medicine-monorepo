"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearKnowledgeFiles,
  deleteKnowledgeFile,
  getKnowledgeFiles,
  uploadKnowledgeFile,
  type KnowledgeFile,
  type KnowledgeVisibility,
  type UploadProgress
} from "@/features/assistant/lib/knowledge";

const ALLOWED_TYPES = [".txt", ".md", ".pdf", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败";
}

function VisibilityPill({ visibility }: { visibility: KnowledgeVisibility }) {
  const label = visibility === "public" ? "公开" : "私人";
  const className =
    visibility === "public"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-100 text-slate-700";

  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>{label}</span>;
}

export default function KnowledgePanel() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [clearingFiles, setClearingFiles] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<KnowledgeVisibility>("private");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ownedFileCount = knowledgeFiles.filter(file => file.isOwner).length;

  const validateFile = (file: File): string | null => {
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;

    if (!ALLOWED_TYPES.includes(fileExt)) {
      return `仅支持 ${ALLOWED_TYPES.join("、")} 格式的文件`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return "文件大小不能超过 10MB";
    }

    return null;
  };

  const resetStatusLater = useCallback(() => {
    window.setTimeout(() => {
      setUploadStatus("idle");
      setUploadMessage("");
    }, 3000);
  }, []);

  const loadKnowledgeFiles = useCallback(async () => {
    setLoadingFiles(true);

    try {
      const files = await getKnowledgeFiles();
      setKnowledgeFiles(files);
    } catch (error) {
      console.error("加载知识库文件失败:", error);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    void loadKnowledgeFiles();
  }, [loadKnowledgeFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const error = validateFile(file);
    if (error) {
      setUploadStatus("error");
      setUploadMessage(error);
      resetStatusLater();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("idle");

    try {
      await uploadKnowledgeFile(file, selectedVisibility, (progress: UploadProgress) => {
        setUploadProgress(progress.progress);
      });

      await loadKnowledgeFiles();
      setUploadStatus("success");
      setUploadMessage(selectedVisibility === "public" ? "公开知识库文件上传成功" : "私人知识库文件上传成功");
      resetStatusLater();
    } catch (error) {
      console.error("上传知识库文件失败:", error);
      setUploadStatus("error");
      setUploadMessage(`上传失败：${getErrorMessage(error)}`);
      resetStatusLater();
    } finally {
      setUploading(false);
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (file: KnowledgeFile) => {
    if (!file.isOwner || deletingFileId) {
      return;
    }

    const confirmed = window.confirm(`确定删除知识库文件“${file.name}”吗？`);
    if (!confirmed) {
      return;
    }

    setDeletingFileId(file.id);
    try {
      await deleteKnowledgeFile(file.id);
      await loadKnowledgeFiles();
      setUploadStatus("success");
      setUploadMessage("知识库文件删除成功");
      resetStatusLater();
    } catch (error) {
      console.error("删除知识库文件失败:", error);
      setUploadStatus("error");
      setUploadMessage(`删除失败：${getErrorMessage(error)}`);
      resetStatusLater();
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleClearKnowledge = async () => {
    if (!ownedFileCount) {
      return;
    }

    const confirmed = window.confirm("确定清空你上传的全部知识库文件吗？这不会影响其他用户的文件。");
    if (!confirmed) {
      return;
    }

    setClearingFiles(true);
    try {
      const deletedCount = await clearKnowledgeFiles();
      await loadKnowledgeFiles();
      setUploadStatus("success");
      setUploadMessage(`已清空 ${deletedCount} 个知识库文件`);
      resetStatusLater();
    } catch (error) {
      console.error("清空知识库失败:", error);
      setUploadStatus("error");
      setUploadMessage(`清空失败：${getErrorMessage(error)}`);
      resetStatusLater();
    } finally {
      setClearingFiles(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              知识库文件
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              上传后会写入 PostgreSQL，AI 检索时会自动合并你的私人知识库和全部公开知识库。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearKnowledge}
            disabled={!ownedFileCount || clearingFiles}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            {clearingFiles ? "清空中..." : "清空我的文件"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">上传文件</label>
            <div className="flex rounded-full border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setSelectedVisibility("private")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedVisibility === "private"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                私人
              </button>
              <button
                type="button"
                onClick={() => setSelectedVisibility("public")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedVisibility === "public" ? "bg-emerald-600 text-white" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                公开
              </button>
            </div>
          </div>

          <div
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              uploading
                ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                : uploadStatus === "success"
                  ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
                  : uploadStatus === "error"
                    ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                    : "cursor-pointer border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
            }`}
            onClick={() => {
              if (!uploading) {
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />

            <div className="mb-3 flex justify-center">
              {uploading ? (
                <svg className="h-10 w-10 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : uploadStatus === "success" ? (
                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : uploadStatus === "error" ? (
                <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-10 w-10 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              )}
            </div>

            {uploading ? (
              <div>
                <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">上传中...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  文件会被切分并写入 PostgreSQL，当前模式：{selectedVisibility === "public" ? "公开" : "私人"}
                </p>
              </div>
            ) : uploadStatus === "success" ? (
              <div>
                <p className="mb-1 text-sm font-medium text-green-600 dark:text-green-400">{uploadMessage}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">现在可以直接在右侧对话里引用这些资料。</p>
              </div>
            ) : uploadStatus === "error" ? (
              <div>
                <p className="mb-1 text-sm font-medium text-red-600 dark:text-red-400">{uploadMessage}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">请检查文件格式、大小或知识库服务配置后重试。</p>
              </div>
            ) : (
              <div>
                <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  点击选择文件，或拖拽文件到这里上传
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  支持 .txt、.md、.pdf、.docx，单个文件不超过 10MB
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">上传进度</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">可见文件</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              共 {knowledgeFiles.length} 个，其中你上传了 {ownedFileCount} 个
            </span>
          </div>

          {loadingFiles ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              正在加载文件列表...
            </div>
          ) : knowledgeFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-600">
              <svg
                className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">还没有可用的知识库文件</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                上传文件后，AI 会自动在你的私人库和公开库中联合检索。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {knowledgeFiles.map(file => (
                <div
                  key={file.id}
                  className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                        <VisibilityPill visibility={file.visibility} />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} · {file.chunks} 个分片 ·{" "}
                        {new Date(file.uploadedAt).toLocaleDateString("zh-CN")} ·{" "}
                        {file.isOwner ? "我上传的" : `来自 ${file.ownerUsername}`}
                      </p>
                    </div>

                    {file.isOwner ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteFile(file)}
                        disabled={deletingFileId === file.id}
                        className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400"
                      >
                        {deletingFileId === file.id ? "删除中..." : "删除"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
