/**
 * Excel 导出 - 主入口
 * 对外暴露 exportToExcel 函数，内部组合列定义 + Worker 完成导出流程
 */

import type { ReportType } from "./excel-columns";
import { COLUMN_DEFS, flattenData } from "./excel-columns";
import { getWorker } from "./excel-worker";

export interface ExportOptions {
  reportType: ReportType;
  reportLabel: string;
  rawData: any[];
}

export interface ExportState {
  exporting: boolean;
  progress: number;
}

/**
 * 导出 Excel 文件
 * 数据转换在主线程完成，Excel 生成在 Web Worker 后台线程执行
 *
 * @param options   - 包含报表类型、标题、原始数据
 * @param onProgress - 可选的进度回调
 * @returns Promise<boolean> 是否导出成功
 */
export function exportToExcel(options: ExportOptions, onProgress?: (state: ExportState) => void): Promise<boolean> {
  const { reportType, reportLabel, rawData } = options;

  if (!rawData || rawData.length === 0) {
    alert("没有可导出的数据");
    return Promise.resolve(false);
  }

  onProgress?.({ exporting: true, progress: 0 });

  return new Promise(resolve => {
    try {
      // 主线程：数据扁平化 → 二维数组
      const columns = COLUMN_DEFS[reportType];
      const headers = columns.map(c => c.label);
      const dataRows = flattenData(reportType, rawData).map(row => headers.map(h => row[h]));

      // 截断工作表名（Excel 限制 ≤31 字符）
      const sheetName = reportLabel.replace(/企业|药品|情况|目录|表/g, "").slice(0, 30);

      onProgress?.({ exporting: true, progress: 30 });

      // Worker 线程：生成 xlsx 二进制数据
      const worker = getWorker();

      worker.onmessage = e => {
        const { success, buffer, error, type, stage, message } = e.data;

        // 处理进度消息（测试用）
        if (type === "progress") {
          console.log(`[Worker ${stage}]`, message);
          return;
        }

        if (success && buffer) {
          onProgress?.({ exporting: true, progress: 90 });

          // 触发浏览器下载
          const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${reportLabel}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.xlsx`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          onProgress?.({ exporting: false, progress: 100 });
          resolve(true);
        } else {
          console.error("Worker 导出失败:", error);
          onProgress?.({ exporting: false, progress: 0 });
          alert(`导出失败: ${error || "未知错误"}`);
          resolve(false);
        }
      };

      worker.onerror = err => {
        console.error("Worker 错误:", err);
        onProgress?.({ exporting: false, progress: 0 });
        alert("导出过程发生错误");
        resolve(false);
      };

      // 发送数据到 Worker（结构化克隆）
      worker.postMessage({
        headers,
        dataRows,
        sheetName
      });

      onProgress?.({ exporting: true, progress: 50 });
    } catch (err) {
      console.error("导出异常:", err);
      onProgress?.({ exporting: false, progress: 0 });
      alert("导出异常，请重试");
      resolve(false);
    }
  });
}
