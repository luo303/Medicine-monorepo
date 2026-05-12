"use client";

import { memo, useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { List, type RowComponentProps } from "react-window";

export interface ColumnDef<T = any> {
  key: string;
  label: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyText?: string;
  rowHeight?: number;
  headerHeight?: number;
  showRecordCount?: boolean;
}

const DEFAULT_ROW_HEIGHT = 52;
const DEFAULT_HEADER_HEIGHT = 48;
const subscribeToClient = () => () => {};

function VirtualRowInner<T>({
  index,
  style,
  columns,
  data,
  onRowClick,
  rowHeight: _rowHeight
}: RowComponentProps<{
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  rowHeight: number;
}>) {
  const item = data[index];
  if (!item) return null;

  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "justify-center text-center";
      case "right":
        return "justify-end text-right";
      default:
        return "jjustify-center text-center";
    }
  };

  return (
    <div
      style={{ ...style, position: "absolute" }}
      className="border-b border-slate-100/60 dark:border-slate-800/40 hover:bg-teal-50/80 dark:hover:bg-teal-950/25 transition-colors"
    >
      <div
        role="row"
        className="flex items-center h-full cursor-pointer"
        onClick={onRowClick ? () => onRowClick(item) : undefined}
      >
        {columns.map(col => {
          const value = (item as Record<string, any>)[col.key];
          const widthStyle = col.width
            ? { width: typeof col.width === "number" ? `${col.width}px` : col.width, flexShrink: 0 }
            : { flex: 1, minWidth: 0 };

          return (
            <div
              key={col.key}
              role="cell"
              style={widthStyle}
              className={`flex flex-1 items-center h-full px-4 ${getAlignClass(col.align)}`}
            >
              <div className="w-full truncate text-[13px] text-slate-800 dark:text-slate-200">
                {col.render ? col.render(value, item, index) : (value ?? "-")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VirtualRow = memo(VirtualRowInner) as typeof VirtualRowInner;

function VirtualTableInner<T extends Record<string, any>>({
  columns,
  data,
  rowKey: _rowKey,
  onRowClick,
  emptyText = "暂无数据",
  rowHeight = DEFAULT_ROW_HEIGHT,
  headerHeight = DEFAULT_HEADER_HEIGHT,
  showRecordCount = true
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(400);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          const height = rect.height - headerHeight - (showRecordCount ? 40 : 0);
          setListHeight(Math.max(height, 200));
        }
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [headerHeight, showRecordCount]);

  const getAlignClass = useCallback((align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "justify-center text-center";
      case "right":
        return "justify-end text-right";
      default:
        return "justify-center text-center";
    }
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center h-12 bg-slate-100 dark:bg-slate-800 border-b border-slate-200/60 dark:border-slate-700/40">
          {columns.map(col => {
            const widthStyle = col.width
              ? { width: typeof col.width === "number" ? `${col.width}px` : col.width, flexShrink: 0 }
              : { flex: 1, minWidth: 0 };

            return (
              <div
                key={col.key}
                style={widthStyle}
                className={`flex items-center h-full px-4 ${getAlignClass(col.align)}`}
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {col.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">{emptyText}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div
        className="flex items-center border-b border-slate-200/60 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800"
        style={{ height: headerHeight }}
      >
        {columns.map(col => {
          const widthStyle = col.width
            ? { width: typeof col.width === "number" ? `${col.width}px` : col.width, flexShrink: 0 }
            : { flex: 1, minWidth: 0 };

          return (
            <div
              key={col.key}
              style={widthStyle}
              className={`flex flex-1 items-center h-full px-4 ${getAlignClass(col.align)}`}
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {col.label}
              </span>
            </div>
          );
        })}
      </div>

      {isClient && (
        <div className="flex-1">
          <List
            className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
            style={{ height: listHeight, width: "100%" }}
            rowCount={data.length}
            rowHeight={rowHeight}
            rowComponent={VirtualRow as any}
            rowProps={{
              columns,
              data,
              onRowClick,
              rowHeight
            }}
            overscanCount={10}
          />
        </div>
      )}

      {showRecordCount && (
        <div className="flex items-center h-10 px-4 border-t border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/50">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            共 <span className="font-medium text-slate-700 dark:text-slate-300">{data.length}</span> 条记录
          </span>
        </div>
      )}
    </div>
  );
}

export const VirtualTable = memo(VirtualTableInner) as typeof VirtualTableInner;
