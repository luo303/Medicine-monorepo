"use client";
import { useState, useRef, useEffect } from "react";
import {
  uploadKnowledgeFile,
  getKnowledgeFiles,
  type KnowledgeFile,
  type UploadProgress
} from "@/features/assistant/lib/knowledge";

export default function KnowledgePanel() {
  // 知识库文件上传相关状态
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 允许的文件类型
  const ALLOWED_TYPES = [".txt", ".md", ".pdf", ".docx"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // 验证文件
  const validateFile = (file: File): string | null => {
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(fileExt)) {
      return `不支持的文件格式，仅支持：${ALLOWED_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "文件大小不能超过 10MB";
    }
    return null;
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    const error = validateFile(file);
    if (error) {
      setUploadStatus("error");
      setUploadMessage(error);
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadMessage("");
      }, 3000);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("idle");

    try {
      // 使用封装的 axios API 上传文件
      const result = await uploadKnowledgeFile(file, (progress: UploadProgress) => {
        setUploadProgress(progress.progress);
      });

      setKnowledgeFiles(prev => [...prev, result]);
      setUploadStatus("success");
      setUploadMessage("文件上传成功！");
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadMessage("");
      }, 3000);
    } catch (error) {
      console.error("上传错误:", error);
      setUploadStatus("error");
      setUploadMessage(`上传失败：${(error as Error).message}`);
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadMessage("");
      }, 3000);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 加载知识库文件列表
  useEffect(() => {
    const loadKnowledgeFiles = async () => {
      try {
        const files = await getKnowledgeFiles();
        if (files) {
          setKnowledgeFiles(files);
        }
      } catch (error) {
        console.error("加载知识库文件失败:", error);
      }
    };

    loadKnowledgeFiles();
  }, []);

  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          知识库管理
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">上传文件到知识库，AI 将基于知识库内容回答</p>
      </div>

      {/* 上传区域 */}
      <div className="p-4 flex-1 overflow-y-auto">
        {/* 文件上传框 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">上传文件</label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                            ${
                              uploading
                                ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                                : uploadStatus === "success"
                                  ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
                                  : uploadStatus === "error"
                                    ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                                    : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
                            }`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />

            {/* 图标 */}
            <div className="flex justify-center mb-3">
              {uploading ? (
                <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : uploadStatus === "success" ? (
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : uploadStatus === "error" ? (
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 text-gray-400 dark:text-gray-500"
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

            {/* 文字说明 */}
            {uploading ? (
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">正在上传...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">请稍候，正在处理文件</p>
              </div>
            ) : uploadStatus === "success" ? (
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">{uploadMessage}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">文件已成功上传到知识库</p>
              </div>
            ) : uploadStatus === "error" ? (
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">{uploadMessage}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">请重试或检查文件格式</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">支持 .txt, .md, .pdf, .docx 格式，最大 10MB</p>
              </div>
            )}
          </div>

          {/* 进度条 */}
          {uploading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">上传进度</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 文件列表 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">知识库文件</label>
            <span className="text-xs text-gray-500 dark:text-gray-400">{knowledgeFiles.length} 个文件</span>
          </div>

          {knowledgeFiles.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2"
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
              <p className="text-sm text-gray-500 dark:text-gray-400">暂无知识库文件</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">上传第一个文件开始使用知识库</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {knowledgeFiles.map((file, index) => (
                <div
                  key={file.id || index}
                  className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-sm hover:shadow-md"
                >
                  {/* 文件图标 */}
                  <div className="shrink-0 w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {(file.size / 1024).toFixed(2)} KB · {new Date(file.uploadedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>

                  {/* 成功标识 */}
                  <div className="shrink-0">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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
