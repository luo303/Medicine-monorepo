"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { exportToExcel } from "@/lib/excel-export";
import { revalidateCache } from "@/lib/cache-client";
import {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation,
  type CreateWarehouseParams,
  type UpdateWarehouseParams,
  type CreateStorageLocationParams,
  type UpdateStorageLocationParams
} from "@/lib/api-client";
import type { Warehouse, StorageLocation } from "@/types/basic-data";
import { Loader2 } from "lucide-react";

interface WarehousesClientProps {
  warehouses: Warehouse[];
  storageLocations: StorageLocation[];
}

export default function WarehousesClient({ warehouses, storageLocations }: WarehousesClientProps) {
  const router = useRouter();
  const [expandedWarehouses, setExpandedWarehouses] = useState<number[]>(
    warehouses.length > 0 ? [warehouses[0].id] : []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [warehouseForm, setWarehouseForm] = useState<CreateWarehouseParams>({
    code: "",
    name: "",
    address: "",
    manager: ""
  });

  const [locationForm, setLocationForm] = useState<CreateStorageLocationParams & { id?: number }>({
    warehouseId: 0,
    code: "",
    capacity: 0,
    description: ""
  });

  const toggleWarehouse = (id: number) => {
    setExpandedWarehouses(prev => (prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]));
  };

  const getLocationsByWarehouse = useMemo(() => {
    const map = new Map<number, StorageLocation[]>();
    storageLocations.forEach(loc => {
      const existing = map.get(loc.warehouseId) || [];
      map.set(loc.warehouseId, [...existing, loc]);
    });
    return map;
  }, [storageLocations]);

  const resetWarehouseForm = () => {
    setWarehouseForm({
      code: "",
      name: "",
      address: "",
      manager: ""
    });
    setEditingWarehouse(null);
  };

  const resetLocationForm = () => {
    setLocationForm({
      warehouseId: 0,
      code: "",
      capacity: 0,
      description: ""
    });
    setEditingLocation(null);
  };

  const openCreateWarehouseDialog = () => {
    resetWarehouseForm();
    setDialogOpen(true);
  };

  const openEditWarehouseDialog = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || "",
      manager: warehouse.manager || ""
    });
    setDialogOpen(true);
  };

  const openLocationDialog = (warehouseId: number, location?: StorageLocation) => {
    setSelectedWarehouseId(warehouseId);
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        id: location.id,
        warehouseId: location.warehouseId,
        code: location.code,
        capacity: location.capacity || 0,
        description: location.description || ""
      });
    } else {
      resetLocationForm();
      setLocationForm(prev => ({ ...prev, warehouseId }));
    }
    setLocationDialogOpen(true);
  };

  const handleSaveWarehouse = async () => {
    if (!warehouseForm.code || !warehouseForm.name) {
      alert("请填写仓库编号和名称");
      return;
    }

    setSaving(true);
    try {
      if (editingWarehouse) {
        const updateParams: UpdateWarehouseParams = {
          code: warehouseForm.code,
          name: warehouseForm.name,
          address: warehouseForm.address,
          manager: warehouseForm.manager
        };
        await updateWarehouse(editingWarehouse.id, updateParams);
      } else {
        await createWarehouse(warehouseForm);
      }
      await revalidateCache("warehouses");
      setDialogOpen(false);
      resetWarehouseForm();
      router.refresh();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWarehouse = async (id: number) => {
    if (!confirm("确定要删除该仓库吗？删除仓库将同时删除其下所有货位。")) return;

    setDeleting(id);
    try {
      await deleteWarehouse(id);
      await revalidateCache("warehouses");
      router.refresh();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationForm.code) {
      alert("请填写货位编号");
      return;
    }

    setSaving(true);
    try {
      if (editingLocation) {
        const updateParams: UpdateStorageLocationParams = {
          code: locationForm.code,
          capacity: locationForm.capacity,
          description: locationForm.description
        };
        await updateStorageLocation(editingLocation.id, updateParams);
      } else {
        await createStorageLocation(locationForm);
      }
      await revalidateCache("storage-locations");
      setLocationDialogOpen(false);
      resetLocationForm();
      router.refresh();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm("确定要删除该货位吗？")) return;

    setDeleting(id);
    try {
      await deleteStorageLocation(id);
      await revalidateCache("storage-locations");
      router.refresh();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = async () => {
    if (warehouses.length === 0) {
      alert("没有可导出的数据");
      return;
    }
    setExporting(true);
    await exportToExcel({
      reportType: "warehouse",
      reportLabel: "仓库数据",
      rawData: warehouses
    });
    setExporting(false);
  };

  const locationColumns: ColumnDef<StorageLocation>[] = useMemo(
    () => [
      {
        key: "code",
        label: "货位编号",
        width: 120,
        render: value => <span className="font-mono text-sm">{value}</span>
      },
      {
        key: "description",
        label: "描述"
      },
      {
        key: "capacity",
        label: "容量",
        width: 100,
        align: "right",
        render: value => <span className="font-mono">{value.toLocaleString()}</span>
      },
      {
        key: "actions",
        label: "操作",
        width: 100,
        align: "center",
        render: (_, item) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
              onClick={() => openLocationDialog(item.warehouseId, item)}
            >
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleDeleteLocation(item.id)}
              disabled={deleting === item.id}
            >
              {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "删除"}
            </Button>
          </div>
        )
      }
    ],
    [deleting]
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">仓库管理</h1>
          <p className="text-sm text-slate-500">管理仓库及货位信息</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {exporting ? "导出中..." : "导出"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
                onClick={openCreateWarehouseDialog}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增仓库
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingWarehouse ? "编辑仓库" : "新增仓库"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm text-slate-600">
                    仓库编号 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="col-span-3"
                    placeholder="请输入仓库编号"
                    value={warehouseForm.code}
                    onChange={e => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    disabled={!!editingWarehouse}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm text-slate-600">
                    仓库名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="col-span-3"
                    placeholder="请输入仓库名称"
                    value={warehouseForm.name}
                    onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm text-slate-600">仓库地址</label>
                  <Input
                    className="col-span-3"
                    placeholder="请输入仓库地址"
                    value={warehouseForm.address}
                    onChange={e => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm text-slate-600">负责人</label>
                  <Input
                    className="col-span-3"
                    placeholder="请输入负责人"
                    value={warehouseForm.manager}
                    onChange={e => setWarehouseForm({ ...warehouseForm, manager: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetWarehouseForm();
                  }}
                >
                  取消
                </Button>
                <Button
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  onClick={handleSaveWarehouse}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {warehouses.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 p-8 text-center text-slate-500">
            暂无仓库数据
          </div>
        ) : (
          warehouses.map(warehouse => {
            const isExpanded = expandedWarehouses.includes(warehouse.id);
            const locations = getLocationsByWarehouse.get(warehouse.id) || [];
            const totalCapacity = locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0);

            return (
              <Collapsible key={warehouse.id} open={isExpanded} onOpenChange={() => toggleWarehouse(warehouse.id)}>
                <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-500">{warehouse.code}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{warehouse.name}</span>
                          <span className="text-sm text-slate-400">（{warehouse.address}）</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-slate-500">
                          负责人: <span className="font-medium">{warehouse.manager}</span>
                          <span className="mx-2">|</span>
                          货位数: <span className="font-medium">{locations.length}</span>
                          <span className="mx-2">|</span>
                          总容量: <span className="font-medium">{totalCapacity.toLocaleString()}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                          onClick={e => {
                            e.stopPropagation();
                            openEditWarehouseDialog(warehouse);
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteWarehouse(warehouse.id);
                          }}
                          disabled={deleting === warehouse.id}
                        >
                          {deleting === warehouse.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "删除"}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-slate-200/60 dark:border-slate-700/40">
                      {locations.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">暂无货位</div>
                      ) : (
                        <div className="h-64">
                          <VirtualTable
                            columns={locationColumns}
                            data={locations}
                            rowKey={item => item.id}
                            emptyText="暂无货位数据"
                            showRecordCount={false}
                          />
                        </div>
                      )}

                      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/30 flex justify-between items-center">
                        <span className="text-sm text-slate-500">共 {locations.length} 个货位</span>
                        <Button variant="outline" size="sm" onClick={() => openLocationDialog(warehouse.id)}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          新增货位
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>

      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "编辑货位" : "新增货位"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-slate-600">
                货位编号 <span className="text-red-500">*</span>
              </label>
              <Input
                className="col-span-3"
                placeholder="如: A01-01"
                value={locationForm.code}
                onChange={e => setLocationForm({ ...locationForm, code: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-slate-600">描述</label>
              <Input
                className="col-span-3"
                placeholder="请输入描述"
                value={locationForm.description}
                onChange={e => setLocationForm({ ...locationForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-slate-600">容量</label>
              <Input
                className="col-span-3"
                placeholder="请输入容量"
                type="number"
                value={locationForm.capacity}
                onChange={e => setLocationForm({ ...locationForm, capacity: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLocationDialogOpen(false);
                resetLocationForm();
              }}
            >
              取消
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              onClick={handleSaveLocation}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
