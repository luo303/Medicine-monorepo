# 药品管理系统 API 接口文档

> 本文档包含所有非GET接口（POST、PUT、DELETE）
> 所有接口需要 JWT 认证（除标注为 Public 的接口）
> 认证方式：在请求头添加 `Authorization: Bearer <token>`

---

## 目录

- [1. 药品管理模块](#1-药品管理模块)
- [2. 仓库管理模块](#2-仓库管理模块)
- [3. 货位管理模块](#3-货位管理模块)
- [4. 库存管理模块](#4-库存管理模块)
- [5. 生产企业管理模块](#5-生产企业管理模块)
- [6. 医疗机构管理模块](#6-医疗机构管理模块)
- [7. 采购管理模块](#7-采购管理模块)
- [8. 销售管理模块](#8-销售管理模块)
- [9. 知识库管理模块](#9-知识库管理模块)
- [10. AI对话模块](#10-ai对话模块)
- [11. 认证模块](#11-认证模块)

---

## 1. 药品管理模块

### 1.1 新增药品

**接口地址**：`POST /drug`

**请求参数**：

```json
{
  "approval_no": "DRG001",
  "name": "阿莫西林胶囊",
  "scientific_name": "Amoxicillin Capsules",
  "model": "0.5g",
  "specification": "0.5g*24粒/盒",
  "is_prescription": true
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| approval_no | string | 是 | 药品批准号，最大50字符 |
| name | string | 是 | 药品名称，最大100字符 |
| scientific_name | string | 否 | 学名，最大100字符 |
| model | string | 否 | 型号，最大50字符 |
| specification | string | 否 | 规格，最大100字符 |
| is_prescription | boolean | 否 | 是否处方药 |

**响应示例**：

```json
{
  "data": {
    "approval_no": "DRG001",
    "name": "阿莫西林胶囊",
    "scientific_name": "Amoxicillin Capsules",
    "model": "0.5g",
    "specification": "0.5g*24粒/盒",
    "is_prescription": true
  },
  "message": "新增药品成功"
}
```

---

### 1.2 修改药品

**接口地址**：`PUT /drug/:approval_no`

**路径参数**：`approval_no` - 药品批准号

**请求参数**：

```json
{
  "name": "阿莫西林胶囊（修改版）",
  "specification": "0.5g*30粒/盒",
  "is_prescription": false
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 药品名称，最大100字符 |
| scientific_name | string | 否 | 学名，最大100字符 |
| model | string | 否 | 型号，最大50字符 |
| specification | string | 否 | 规格，最大100字符 |
| is_prescription | boolean | 否 | 是否处方药 |

**响应示例**：

```json
{
  "data": {
    "approval_no": "DRG001",
    "name": "阿莫西林胶囊（修改版）",
    "specification": "0.5g*30粒/盒",
    "is_prescription": false
  },
  "message": "修改药品成功"
}
```

---

### 1.3 删除药品

**接口地址**：`DELETE /drug/:approval_no`

**路径参数**：`approval_no` - 药品批准号

**响应示例**：

```json
{
  "message": "删除药品成功"
}
```

---

## 2. 仓库管理模块

### 2.1 新增仓库

**接口地址**：`POST /warehouse`

**请求参数**：

```json
{
  "code": "WH001",
  "name": "中心仓库",
  "address": "北京市朝阳区建国路88号",
  "manager": "张三"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 是 | 仓号，最大20字符，唯一 |
| name | string | 是 | 仓库名称，最大100字符 |
| address | string | 否 | 仓库地址，最大200字符 |
| manager | string | 否 | 仓库管理员，最大50字符 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "code": "WH001",
    "name": "中心仓库",
    "address": "北京市朝阳区建国路88号",
    "manager": "张三"
  },
  "message": "新增仓库成功"
}
```

---

### 2.2 修改仓库

**接口地址**：`PUT /warehouse/:id`

**路径参数**：`id` - 仓库ID

**请求参数**：

```json
{
  "name": "中心仓库（已扩建）",
  "address": "北京市朝阳区建国路100号",
  "manager": "李四"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 否 | 仓号，最大20字符 |
| name | string | 否 | 仓库名称，最大100字符 |
| address | string | 否 | 仓库地址，最大200字符 |
| manager | string | 否 | 仓库管理员，最大50字符 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "code": "WH001",
    "name": "中心仓库（已扩建）",
    "address": "北京市朝阳区建国路100号",
    "manager": "李四"
  },
  "message": "修改仓库成功"
}
```

---

### 2.3 删除仓库

**接口地址**：`DELETE /warehouse/:id`

**路径参数**：`id` - 仓库ID

**响应示例**：

```json
{
  "message": "删除仓库成功"
}
```

---

## 3. 货位管理模块

### 3.1 新增货位

**接口地址**：`POST /storage-location`

**请求参数**：

```json
{
  "warehouseId": 1,
  "code": "A-01-01",
  "capacity": 1000,
  "description": "中心仓库A区1排1列-常温区"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| warehouseId | number | 是 | 所属仓库ID |
| code | string | 是 | 货位号，最大20字符 |
| capacity | number | 否 | 容量，不能小于0 |
| description | string | 否 | 描述，最大200字符 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "warehouseId": 1,
    "code": "A-01-01",
    "capacity": 1000,
    "description": "中心仓库A区1排1列-常温区"
  },
  "message": "新增货位成功"
}
```

---

### 3.2 修改货位

**接口地址**：`PUT /storage-location/:id`

**路径参数**：`id` - 货位ID

**请求参数**：

```json
{
  "capacity": 1500,
  "description": "中心仓库A区1排1列-常温区（已扩容）"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| warehouseId | number | 否 | 所属仓库ID |
| code | string | 否 | 货位号，最大20字符 |
| capacity | number | 否 | 容量，不能小于0 |
| description | string | 否 | 描述，最大200字符 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "warehouseId": 1,
    "code": "A-01-01",
    "capacity": 1500,
    "description": "中心仓库A区1排1列-常温区（已扩容）"
  },
  "message": "修改货位成功"
}
```

---

### 3.3 删除货位

**接口地址**：`DELETE /storage-location/:id`

**路径参数**：`id` - 货位ID

**响应示例**：

```json
{
  "message": "删除货位成功"
}
```

---

## 4. 库存管理模块

### 4.1 新增库存记录

**接口地址**：`POST /inventory`

**请求参数**：

```json
{
  "warehouse_code": "WH001",
  "location_code": "A-01-01",
  "manufacturerApprovalNo": "MAN001",
  "drugApprovalNo": "DRG001",
  "drug_name": "阿莫西林胶囊",
  "batch_no": "B20240101",
  "production_date": "2024-01-01",
  "expiry_date": "2026-01-01",
  "quantity": 5000
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| warehouse_code | string | 是 | 仓号，最大20字符 |
| location_code | string | 是 | 货位号，最大20字符 |
| manufacturerApprovalNo | string | 否 | 生产企业批准号，最大50字符 |
| drugApprovalNo | string | 是 | 药品批准号，最大50字符 |
| drug_name | string | 是 | 药品名称，最大100字符 |
| batch_no | string | 否 | 批号，最大50字符 |
| production_date | string | 是 | 生产日期，格式：YYYY-MM-DD |
| expiry_date | string | 是 | 有效截止日期，格式：YYYY-MM-DD |
| quantity | number | 是 | 库存数量，不能小于0 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "warehouse_code": "WH001",
    "location_code": "A-01-01",
    "drugApprovalNo": "DRG001",
    "drug_name": "阿莫西林胶囊",
    "quantity": 5000
  },
  "message": "新增库存记录成功"
}
```

---

### 4.2 修改库存记录

**接口地址**：`PUT /inventory/:id`

**路径参数**：`id` - 库存ID

**请求参数**：

```json
{
  "quantity": 4500,
  "batch_no": "B20240101-2"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| warehouse_code | string | 否 | 仓号，最大20字符 |
| location_code | string | 否 | 货位号，最大20字符 |
| manufacturerApprovalNo | string | 否 | 生产企业批准号，最大50字符 |
| drugApprovalNo | string | 否 | 药品批准号，最大50字符 |
| drug_name | string | 否 | 药品名称，最大100字符 |
| batch_no | string | 否 | 批号，最大50字符 |
| production_date | string | 否 | 生产日期，格式：YYYY-MM-DD |
| expiry_date | string | 否 | 有效截止日期，格式：YYYY-MM-DD |
| quantity | number | 否 | 库存数量，不能小于0 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "quantity": 4500
  },
  "message": "修改库存记录成功"
}
```

---

### 4.3 删除库存记录

**接口地址**：`DELETE /inventory/:id`

**路径参数**：`id` - 库存ID

**响应示例**：

```json
{
  "message": "删除库存记录成功"
}
```

---

## 5. 生产企业管理模块

### 5.1 新增生产企业

**接口地址**：`POST /manufacturer`

**请求参数**：

```json
{
  "approval_no": "MAN001",
  "name": "华北制药集团有限责任公司",
  "city": "石家庄",
  "address": "河北省石家庄市和平路388号",
  "postal_code": "050015",
  "phone": "0311-66668888",
  "is_gmp": true
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| approval_no | string | 是 | 企业批准号，最大50字符 |
| name | string | 是 | 企业名称，最大100字符 |
| city | string | 否 | 所在城市，最大50字符 |
| address | string | 否 | 地址，最大200字符 |
| postal_code | string | 否 | 邮政编码，最大20字符 |
| phone | string | 否 | 联系电话，最大50字符 |
| is_gmp | boolean | 否 | 是否GMP认证 |

**响应示例**：

```json
{
  "data": {
    "approval_no": "MAN001",
    "name": "华北制药集团有限责任公司",
    "city": "石家庄",
    "is_gmp": true
  },
  "message": "新增制造商成功"
}
```

---

### 5.2 修改生产企业

**接口地址**：`PUT /manufacturer/:approval_no`

**路径参数**：`approval_no` - 企业批准号

**请求参数**：

```json
{
  "name": "华北制药集团（更新）",
  "phone": "0311-66669999",
  "is_gmp": true
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 企业名称，最大100字符 |
| city | string | 否 | 所在城市，最大50字符 |
| address | string | 否 | 地址，最大200字符 |
| postal_code | string | 否 | 邮政编码，最大20字符 |
| phone | string | 否 | 联系电话，最大50字符 |
| is_gmp | boolean | 否 | 是否GMP认证 |

**响应示例**：

```json
{
  "data": {
    "approval_no": "MAN001",
    "name": "华北制药集团（更新）"
  },
  "message": "修改制造商成功"
}
```

---

### 5.3 删除生产企业

**接口地址**：`DELETE /manufacturer/:approval_no`

**路径参数**：`approval_no` - 企业批准号

**响应示例**：

```json
{
  "message": "删除制造商成功"
}
```

---

## 6. 医疗机构管理模块

### 6.1 新增医疗机构

**接口地址**：`POST /MedicalInstitution`

**请求参数**：

```json
{
  "approval_no": "HOS001",
  "name": "北京协和医院",
  "address": "北京市东城区帅府园1号",
  "postal_code": "100730",
  "phone": "010-69156699",
  "is_specialized": false
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| approval_no | string | 是 | 机构批准号，最大50字符 |
| name | string | 是 | 机构名称，最大100字符 |
| address | string | 否 | 地址，最大200字符 |
| postal_code | string | 否 | 邮政编码，最大20字符 |
| phone | string | 否 | 联系电话，最大50字符 |
| is_specialized | boolean | 否 | 是否专科医院 |

**响应示例**：

```json
{
  "data": {
    "approval_no": "HOS001",
    "name": "北京协和医院",
    "address": "北京市东城区帅府园1号"
  },
  "message": "新增医疗机构成功"
}
```

---

### 6.2 修改医疗机构

**接口地址**：`PUT /MedicalInstitution/:approval_no`

**路径参数**：`approval_no` - 机构批准号

**请求参数**：

```json
{
  "name": "北京协和医院（东院）",
  "phone": "010-69156600"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 机构名称，最大100字符 |
| address | string | 否 | 地址，最大200字符 |
| postal_code | string | 否 | 邮政编码，最大20字符 |
| phone | string | 否 | 联系电话，最大50字符 |
| is_specialized | boolean | 否 | 是否专科医院 |

**响应示例**：

```json
{
  "data": {
    "approval_no": "HOS001",
    "name": "北京协和医院（东院）"
  },
  "message": "修改医疗机构成功"
}
```

---

### 6.3 删除医疗机构

**接口地址**：`DELETE /MedicalInstitution/:approval_no`

**路径参数**：`approval_no` - 机构批准号

**响应示例**：

```json
{
  "message": "删除医疗机构成功"
}
```

---

## 7. 采购管理模块

### 7.1 采购订单

#### 7.1.1 新增采购订单

**接口地址**：`POST /purchase/order`

**请求参数**：

```json
{
  "order_no": "PO20240406001",
  "order_date": "2024-04-06",
  "manufacturerApprovalNo": "MAN001",
  "manufacturer_name": "华北制药集团有限责任公司",
  "purchaser": "采购员A",
  "purchaseDetails": [
    {
      "drugApprovalNo": "DRG001",
      "drug_name": "阿莫西林胶囊",
      "production_date": "2024-04-06",
      "validity_months": 24,
      "quantity": 5000,
      "unit_price": 15.0
    }
  ]
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_no | string | 是 | 采购单号，最大50字符 |
| order_date | string | 是 | 采购日期，格式：YYYY-MM-DD |
| manufacturerApprovalNo | string | 是 | 生产企业批准号，最大50字符 |
| manufacturer_name | string | 是 | 企业名称，最大100字符 |
| purchaser | string | 是 | 采购员，1 到 50 字符 |
| purchaseDetails | array | 是 | 采购明细，至少 1 条，后端会基于明细自动计算总金额并设置初始状态 |

**响应示例**：

```json
{
  "data": {
    "order_no": "PO20240406001",
    "order_date": "2024-04-06",
    "manufacturer_name": "华北制药集团有限责任公司",
    "total_amount": 125000.0
  },
  "message": "新增采购订单成功"
}
```

---

#### 7.1.2 修改采购订单

**接口地址**：`PUT /purchase/order/:order_no`

**路径参数**：`order_no` - 采购单号

**请求参数**：

```json
{
  "order_date": "2024-04-07",
  "total_amount": 130000.0,
  "purchaser": "采购员B",
  "status": "已审核"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_date | string | 否 | 采购日期，格式：YYYY-MM-DD |
| manufacturer_name | string | 否 | 企业名称，最大100字符 |
| total_amount | number | 否 | 总金额 |
| purchaser | string | 否 | 采购员，最大50字符 |
| status | string | 否 | 状态，可选值：待审核、已审核、部分入库、全部入库、已完成 |

**响应示例**：

```json
{
  "data": {
    "order_no": "PO20240406001",
    "status": "已审核"
  },
  "message": "修改采购订单成功"
}
```

---

#### 7.1.3 删除采购订单

**接口地址**：`DELETE /purchase/order/:order_no`

**路径参数**：`order_no` - 采购单号

**响应示例**：

```json
{
  "message": "删除采购订单成功"
}
```

---

### 7.2 采购明细

#### 7.2.1 新增采购明细

**接口地址**：`POST /purchase/detail`

**请求参数**：

```json
{
  "orderNo": "PO20240406001",
  "drugApprovalNo": "DRG001",
  "drug_name": "阿莫西林胶囊",
  "production_date": "2024-04-06",
  "validity_months": 24,
  "quantity": 5000,
  "unit_price": 15.0
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 采购单号，最大50字符 |
| drugApprovalNo | string | 是 | 药品批准号，最大50字符 |
| drug_name | string | 是 | 药品名称，最大100字符 |
| production_date | string | 是 | 生产日期，格式：YYYY-MM-DD |
| validity_months | number | 是 | 有效期（月），不能小于1 |
| quantity | number | 是 | 采购数量，不能小于1 |
| unit_price | number | 是 | 采购单价，不能小于0 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "orderNo": "PO20240406001",
    "drug_name": "阿莫西林胶囊",
    "quantity": 5000,
    "unit_price": 15.0,
    "amount": 75000.0
  },
  "message": "创建采购明细成功"
}
```

---

#### 7.2.2 修改采购明细

**接口地址**：`PUT /purchase/detail/:id`

**路径参数**：`id` - 明细ID

**请求参数**：

```json
{
  "quantity": 6000,
  "unit_price": 16.0
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| quantity | number | 否 | 采购数量，不能小于1 |
| unit_price | number | 否 | 采购单价，不能小于0 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "quantity": 6000,
    "unit_price": 16.0
  },
  "message": "修改采购明细成功"
}
```

---

#### 7.2.3 删除采购明细

**接口地址**：`DELETE /purchase/detail/:id`

**路径参数**：`id` - 明细ID

**响应示例**：

```json
{
  "message": "删除采购明细成功"
}
```

---

### 7.3 采购入库

#### 7.3.1 新增采购入库记录

**接口地址**：`POST /purchase/storage`

**请求参数**：

```json
{
  "orderNo": "PO20240406001",
  "storage_date": "2024-04-06",
  "inspector": "检验员甲",
  "keeper": "保管员甲",
  "entries": [
    {
      "detailId": 1,
      "warehouse_code": "WH001",
      "location_code": "A-01-01",
      "quantity": 5000,
      "batch_no": "B20240406"
    }
  ]
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 采购单号，最大50字符 |
| storage_date | string | 是 | 入库日期，格式：YYYY-MM-DD |
| inspector | string | 是 | 检验员，1 到 50 字符 |
| keeper | string | 是 | 保管员，1 到 50 字符 |
| entries | array | 是 | 入库明细，至少 1 条 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "orderNo": "PO20240406001",
    "drug_name": "阿莫西林胶囊",
    "quantity": 5000
  },
  "message": "创建采购入库记录成功"
}
```

---

#### 7.3.2 修改采购入库记录

**接口地址**：`PUT /purchase/storage/:id`

**路径参数**：`id` - 入库记录ID

**请求参数**：

```json
{
  "quantity": 4500,
  "batch_no": "B20240406-2"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| quantity | number | 否 | 入库数量，不能小于1 |
| batch_no | string | 否 | 批号，最大50字符 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "quantity": 4500
  },
  "message": "修改采购入库记录成功"
}
```

---

#### 7.3.3 删除采购入库记录

**接口地址**：`DELETE /purchase/storage/:id`

**路径参数**：`id` - 入库记录ID

**响应示例**：

```json
{
  "message": "删除采购入库记录成功"
}
```

---

## 8. 销售管理模块

### 8.1 销售订单

#### 8.1.1 新增销售订单

**接口地址**：`POST /sales/order`

**请求参数**：

```json
{
  "order_no": "SO20240406001",
  "sales_date": "2024-04-06",
  "institutionApprovalNo": "HOS001",
  "institution_name": "北京协和医院",
  "salesperson": "销售员甲",
  "salesDetails": [
    {
      "manufacturerApprovalNo": "MAN001",
      "drugApprovalNo": "DRG001",
      "drug_name": "阿莫西林胶囊",
      "production_date": "2024-04-06",
      "quantity": 3000,
      "unit_price": 18.0
    }
  ]
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_no | string | 是 | 销售单号，最大50字符 |
| sales_date | string | 是 | 销售日期，格式：YYYY-MM-DD |
| institutionApprovalNo | string | 是 | 机构批准号，最大50字符 |
| institution_name | string | 是 | 机构名称，最大100字符 |
| salesperson | string | 是 | 销售员，1 到 50 字符 |
| salesDetails | array | 是 | 销售明细，至少 1 条，后端会基于明细自动计算总金额并设置初始状态 |

**响应示例**：

```json
{
  "data": {
    "order_no": "SO20240406001",
    "sales_date": "2024-04-06",
    "institution_name": "北京协和医院",
    "total_amount": 85000.0
  },
  "message": "创建销售订单成功"
}
```

---

#### 8.1.2 修改销售订单

**接口地址**：`PUT /sales/order/:order_no`

**路径参数**：`order_no` - 销售单号

**请求参数**：

```json
{
  "sales_date": "2024-04-07",
  "total_amount": 90000.0,
  "salesperson": "销售员乙",
  "status": "已审核"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sales_date | string | 否 | 销售日期，格式：YYYY-MM-DD |
| institution_name | string | 否 | 机构名称，最大100字符 |
| total_amount | number | 否 | 总金额 |
| salesperson | string | 否 | 销售员，最大50字符 |
| status | string | 否 | 状态，可选值：待审核、已审核、部分出库、全部出库、已完成 |

**响应示例**：

```json
{
  "data": {
    "order_no": "SO20240406001",
    "status": "已审核"
  },
  "message": "修改销售订单成功"
}
```

---

#### 8.1.3 删除销售订单

**接口地址**：`DELETE /sales/order/:order_no`

**路径参数**：`order_no` - 销售单号

**响应示例**：

```json
{
  "message": "删除销售订单成功"
}
```

---

### 8.2 销售明细

#### 8.2.1 新增销售明细

**接口地址**：`POST /sales/detail`

**请求参数**：

```json
{
  "orderNo": "SO20240406001",
  "manufacturerApprovalNo": "MAN001",
  "drugApprovalNo": "DRG001",
  "drug_name": "阿莫西林胶囊",
  "production_date": "2024-04-06",
  "quantity": 3000,
  "unit_price": 18.0
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 销售单号，最大50字符 |
| manufacturerApprovalNo | string | 是 | 生产企业批准号，最大50字符 |
| drugApprovalNo | string | 是 | 药品批准号，最大50字符 |
| drug_name | string | 是 | 药品名称，最大100字符 |
| production_date | string | 是 | 生产日期，格式：YYYY-MM-DD |
| quantity | number | 是 | 销售数量，不能小于1 |
| unit_price | number | 是 | 销售单价，不能小于0 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "orderNo": "SO20240406001",
    "drug_name": "阿莫西林胶囊",
    "quantity": 3000,
    "unit_price": 18.0,
    "amount": 54000.0
  },
  "message": "创建销售明细成功"
}
```

---

#### 8.2.2 修改销售明细

**接口地址**：`PUT /sales/detail/:id`

**路径参数**：`id` - 明细ID

**请求参数**：

```json
{
  "quantity": 3500,
  "unit_price": 19.0
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| quantity | number | 否 | 销售数量，不能小于1 |
| unit_price | number | 否 | 销售单价，不能小于0 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "quantity": 3500,
    "unit_price": 19.0
  },
  "message": "修改销售明细成功"
}
```

---

#### 8.2.3 删除销售明细

**接口地址**：`DELETE /sales/detail/:id`

**路径参数**：`id` - 明细ID

**响应示例**：

```json
{
  "message": "删除销售明细成功"
}
```

---

### 8.3 销售出库

#### 8.3.1 新增销售出库记录

**接口地址**：`POST /sales/outbound`

**请求参数**：

```json
{
  "orderNo": "SO20240406001",
  "outbound_date": "2024-04-06",
  "inspector": "检验员甲",
  "keeper": "保管员甲",
  "entries": [
    {
      "detailId": 1,
      "inventoryId": 12,
      "quantity": 3000
    }
  ]
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 销售单号，最大50字符 |
| outbound_date | string | 是 | 出库日期，格式：YYYY-MM-DD |
| inspector | string | 是 | 检验员，1 到 50 字符 |
| keeper | string | 是 | 保管员，1 到 50 字符 |
| entries | array | 是 | 出库明细，至少 1 条 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "orderNo": "SO20240406001",
    "drug_name": "阿莫西林胶囊",
    "quantity": 3000
  },
  "message": "创建销售出库记录成功"
}
```

---

#### 8.3.2 修改销售出库记录

**接口地址**：`PUT /sales/outbound/:id`

**路径参数**：`id` - 出库记录ID

**请求参数**：

```json
{
  "quantity": 2800
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| quantity | number | 否 | 出库数量，不能小于1 |

**响应示例**：

```json
{
  "data": {
    "id": 1,
    "quantity": 2800
  },
  "message": "修改销售出库记录成功"
}
```

---

#### 8.3.3 删除销售出库记录

**接口地址**：`DELETE /sales/outbound/:id`

**路径参数**：`id` - 出库记录ID

**响应示例**：

```json
{
  "message": "删除销售出库记录成功"
}
```

---

## 9. 知识库管理模块

### 9.1 上传文件到知识库

**接口地址**：`POST /knowledge/upload`

**Content-Type**：`multipart/form-data`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 文件，支持类型：.txt, .md, .pdf, .docx，最大10MB |

**响应示例**：

```json
{
  "success": true,
  "message": "文件处理成功",
  "data": {
    "success": true,
    "chunks": 15,
    "filename": "document.pdf"
  }
}
```

---

### 9.2 清空知识库

**接口地址**：`POST /knowledge/clear`

**请求参数**：无

**响应示例**：

```json
{
  "success": true,
  "message": "知识库已清空",
  "data": null
}
```

---

## 10. AI对话模块

### 10.1 AI对话流式接口

**接口地址**：`POST /ai/chat/stream`

**请求参数**：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "查询阿莫西林的库存情况"
    },
    {
      "role": "assistant",
      "content": "我来帮您查询阿莫西林的库存情况。"
    },
    {
      "role": "user",
      "content": "还有多少库存？"
    }
  ]
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| messages | array | 是 | 对话消息数组 |
| messages[].role | string | 是 | 角色：user/assistant/system/tool |
| messages[].content | string | 是 | 消息内容 |
| messages[].tool_call_id | string | 否 | 工具调用ID（role为tool时需要） |

**响应格式**：Server-Sent Events (SSE)

**响应示例**：

```
event: message
data: {"type":"text","text":"我来帮您查询"}

event: message
data: {"type":"tool","tool_calls":[{"name":"query_inventory","args":{"drug_name":"阿莫西林"}}]}

event: message
data: {"type":"text","text":"根据查询结果，阿莫西林库存充足。"}

data: [DONE]
```

---

## 11. 认证模块

### 11.1 用户注册

**接口地址**：`POST /auth/register`

**请求参数**：

```json
{
  "username": "admin",
  "password": "123456",
  "email": "admin@example.com"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| email | string | 否 | 邮箱 |

**响应示例**：

```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

---

### 11.2 用户登录

**接口地址**：`POST /auth/login`

**请求参数**：

```json
{
  "username": "admin",
  "password": "123456"
}
```

**参数说明**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例**：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

---

## 附录：订单状态枚举

### 采购订单状态

| 状态值   | 说明                 |
| -------- | -------------------- |
| 待审核   | 订单刚创建，等待审核 |
| 已审核   | 审核通过，等待入库   |
| 部分入库 | 部分商品已入库       |
| 全部入库 | 所有商品已入库       |
| 已完成   | 订单完成             |

### 销售订单状态

| 状态值   | 说明                 |
| -------- | -------------------- |
| 待审核   | 订单刚创建，等待审核 |
| 已审核   | 审核通过，等待出库   |
| 部分出库 | 部分商品已出库       |
| 全部出库 | 所有商品已出库       |
| 已完成   | 订单完成             |
