/**
 * Excel 导出 - Web Worker 管理（主线程侧）
 * 负责创建和管理后台线程实例，与 Worker 脚本文件解耦
 */

let workerInstance: Worker | null = null;

/** Worker 脚本路径（public 目录下的静态资源） */
const WORKER_URL = "/workers/excel-export.worker.js";

/**
 * 获取或复用 Worker 实例（单例模式）
 * 每次导出复用同一个 Worker，避免重复创建开销
 */
export function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(WORKER_URL);
  }
  return workerInstance;
}

/**
 * 销毁 Worker 实例
 * 在组件卸载或不再需要时调用，释放资源
 */
export function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}
