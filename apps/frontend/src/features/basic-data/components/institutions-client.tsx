"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VirtualTable, type ColumnDef } from "@/components/virtual-table";
import { exportToExcel } from "@/lib/excel-export";
import { revalidateCache } from "@/lib/cache-client";
import {
  createMedicalInstitution,
  updateMedicalInstitution,
  deleteMedicalInstitution,
  type CreateMedicalInstitutionParams,
  type UpdateMedicalInstitutionParams
} from "@/lib/api-client";
import type { MedicalInstitution } from "@/types/basic-data";
import { Loader2 } from "lucide-react";

interface InstitutionsClientProps {
  institutions: MedicalInstitution[];
}

export default function InstitutionsClient({ institutions }: InstitutionsClientProps) {
  const router = useRouter();
  const [searchName, setSearchName] = useState("");
  const [selectedType, setSelectedType] = useState("全部");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<MedicalInstitution | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateMedicalInstitutionParams>({
    approval_no: "",
    name: "",
    address: "",
    postal_code: "",
    phone: "",
    is_specialized: false
  });

  const filteredData = useMemo(() => {
    return institutions.filter(item => {
      const matchName = item.name.includes(searchName);
      const matchType =
        selectedType === "全部" ||
        (selectedType === "综合" && !item.is_specialized) ||
        (selectedType === "专科" && item.is_specialized);
      return matchName && matchType;
    });
  }, [institutions, searchName, selectedType]);

  const resetForm = () => {
    setFormData({
      approval_no: "",
      name: "",
      address: "",
      postal_code: "",
      phone: "",
      is_specialized: false
    });
    setEditingInstitution(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((institution: MedicalInstitution) => {
    setEditingInstitution(institution);
    setFormData({
      approval_no: institution.approval_no,
      name: institution.name,
      address: institution.address || "",
      postal_code: institution.postal_code || "",
      phone: institution.phone || "",
      is_specialized: institution.is_specialized || false
    });
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!formData.approval_no || !formData.name) {
      alert("请填写批准号和机构名称");
      return;
    }

    setSaving(true);
    try {
      if (editingInstitution) {
        const updateParams: UpdateMedicalInstitutionParams = {
          name: formData.name,
          address: formData.address,
          postal_code: formData.postal_code,
          phone: formData.phone,
          is_specialized: formData.is_specialized
        };
        await updateMedicalInstitution(editingInstitution.approval_no, updateParams);
      } else {
        await createMedicalInstitution(formData);
      }
      await revalidateCache("institutions");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(
    async (approvalNo: string) => {
      if (!confirm("确定要删除该机构吗？")) return;

      setDeleting(approvalNo);
      try {
        await deleteMedicalInstitution(approvalNo);
        await revalidateCache("institutions");
        router.refresh();
      } catch (error) {
        console.error("删除失败:", error);
        alert("删除失败，请重试");
      } finally {
        setDeleting(null);
      }
    },
    [router]
  );

  const handleExport = async () => {
    if (filteredData.length === 0) {
      alert("没有可导出的数据");
      return;
    }
    setExporting(true);
    await exportToExcel({
      reportType: "institution",
      reportLabel: "医疗机构数据",
      rawData: filteredData
    });
    setExporting(false);
  };

  const columns: ColumnDef<MedicalInstitution>[] = useMemo(
    () => [
      {
        key: "approval_no",
        label: "批准号",
        width: 120,
        render: value => <span className="font-mono text-sm">{value}</span>
      },
      {
        key: "name",
        label: "机构名称",
        render: value => <span className="font-medium">{value}</span>
      },
      {
        key: "address",
        label: "地址"
      },
      {
        key: "phone",
        label: "电话",
        width: 130,
        render: value => <span className="font-mono text-sm">{value}</span>
      },
      {
        key: "is_specialized",
        label: "机构类型",
        width: 100,
        align: "center",
        render: value => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              !value
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            }`}
          >
            {!value ? "综合医院" : "专科医院"}
          </span>
        )
      },
      {
        key: "actions",
        label: "操作",
        width: 120,
        align: "center",
        render: (_, item) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
              onClick={() => openEditDialog(item)}
            >
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleDelete(item.approval_no)}
              disabled={deleting === item.approval_no}
            >
              {deleting === item.approval_no ? <Loader2 className="w-4 h-4 animate-spin" /> : "删除"}
            </Button>
          </div>
        )
      }
    ],
    [deleting, handleDelete, openEditDialog]
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">医疗机构管理</h1>
          <p className="text-sm text-slate-500">管理医疗机构基础信息</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
              onClick={openCreateDialog}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增机构
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingInstitution ? "编辑医疗机构" : "新增医疗机构"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm text-slate-600">
                  机构批准号 <span className="text-red-500">*</span>
                </label>
                <Input
                  className="col-span-3"
                  placeholder="请输入批准号"
                  value={formData.approval_no}
                  onChange={e => setFormData({ ...formData, approval_no: e.target.value })}
                  disabled={!!editingInstitution}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm text-slate-600">
                  机构名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  className="col-span-3"
                  placeholder="请输入机构名称"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm text-slate-600">地址</label>
                <Input
                  className="col-span-3"
                  placeholder="请输入详细地址"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm text-slate-600">邮政编码</label>
                <Input
                  className="col-span-3"
                  placeholder="请输入邮政编码"
                  value={formData.postal_code}
                  onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm text-slate-600">联系电话</label>
                <Input
                  className="col-span-3"
                  placeholder="请输入联系电话"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm text-slate-600">机构类型</label>
                <Select
                  value={formData.is_specialized ? "专科" : "综合"}
                  onValueChange={value => setFormData({ ...formData, is_specialized: value === "专科" })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="综合">综合医院</SelectItem>
                    <SelectItem value="专科">专科医院</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                取消
              </Button>
              <Button
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={handleSave}
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

      <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">机构名称：</span>
            <Input
              className="w-40"
              placeholder="请输入"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">机构类型：</span>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="综合">综合医院</SelectItem>
                <SelectItem value="专科">专科医院</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchName("");
                setSelectedType("全部");
              }}
            >
              重置
            </Button>
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
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
        <VirtualTable
          columns={columns}
          data={filteredData}
          rowKey={item => item.approval_no}
          emptyText="暂无机构数据"
        />
      </div>
    </div>
  );
}
