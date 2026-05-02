/**
 * Excel 导出 Worker 线程
 * 在后台线程中执行 SheetJS 的 Excel 文件生成逻辑
 * 接收主线程发送的表头和数据行，返回 ArrayBuffer 二进制数据
 */

importScripts('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');

self.onmessage = function(e) {
    const { headers, dataRows, sheetName } = e.data;

    try {
        const wb = XLSX.utils.book_new();
        const wsData = [headers, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // 根据表头文字长度自适应列宽
        ws['!cols'] = headers.map(function(h) {
            return { wch: Math.max(h.length * 2, 12) };
        });

        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        var buffer = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
        });

        self.postMessage({ success: true, buffer }, [buffer]);
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};
