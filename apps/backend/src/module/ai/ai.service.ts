import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { createAgent } from 'langchain';
import { DrugService } from '../basic/drug/drug.service';
import { WarehouseService } from '../basic/warehouse/warehouse.service';
import { ManufacturerService } from '../basic/manufacturer/manufacturer.service';
import { MedicalInstitutionService } from '../basic/MedicalInstitution/MedicalInstitution.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from '@/entity/Inventory';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { SalesOrder } from '@/entity/SalesOrder';
import { StorageLocation } from '@/entity/StorageLocation';
import { Repository } from 'typeorm';
import {
  createDrugTools,
  createWarehouseTools,
  createInventoryTools,
  createManufacturerTools,
  createMedicalInstitutionTools,
  createPurchaseOrderTools,
  createSalesOrderTools,
  createStorageLocationTools,
  createKnowledgeTool,
} from './tools';
import { IAgent } from './tools/tool.types';

@Injectable()
export class AiService implements OnModuleInit {
  public agent: IAgent;

  constructor(
    private readonly drugService: DrugService,
    private readonly warehouseService: WarehouseService,
    private readonly manufacturerService: ManufacturerService,
    private readonly medicalInstitutionService: MedicalInstitutionService,
    private readonly knowledgeService: KnowledgeService,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(StorageLocation)
    private readonly storageLocationRepository: Repository<StorageLocation>,
  ) {}

  onModuleInit() {
    this.init();
  }

  init() {
    // ✅ 严格按照用户提供的初始化方式，不添加多余配置
    const model = new ChatOllama({
      model: 'gpt-oss:120b-cloud',
      temperature: 0,
    });

    const tools = [
      ...createDrugTools(this.drugService),
      ...createWarehouseTools(this.warehouseService),
      ...createInventoryTools(this.inventoryRepository),
      ...createManufacturerTools(this.manufacturerService),
      ...createMedicalInstitutionTools(this.medicalInstitutionService),
      ...createPurchaseOrderTools(this.purchaseOrderRepository),
      ...createSalesOrderTools(this.salesOrderRepository),
      ...createStorageLocationTools(this.storageLocationRepository),
      ...createKnowledgeTool(this.knowledgeService),
    ];

    // ✅ 只负责创建 Agent，严格按照用户提供的 Agent 创建方式
    // 强制类型转换为 IAgent 以便在 Controller 中类型安全地使用
    this.agent = createAgent({
      model: model,
      tools: tools,
      systemPrompt: `你是专业的助手，回答必须基于搜索结果。
## 重要规则
1. 当用户询问药品、仓库、库存、生产企业、医疗机构、采购订单、销售订单或货位相关问题时，你必须调用相应的工具来获取数据
2. 当用户询问已上传文件里的内容时，你必须优先调用 query_knowledge_base 工具
3. 禁止编造数据，必须基于工具返回的真实结果来回答
4. 如果不确定用户指的是什么，可以先调用相关工具查看所有数据
5. 回答要简洁明了，直接展示查询结果
6. markdown 格式一定要正确且合理
7. 当返回多列数据时，必须使用标准 Markdown 表格，表头、分隔线、数据行都要完整，禁止使用空格手动对齐列
8. 当返回单条记录或明细较多时，优先使用项目列表，避免伪表格
9. 不要输出不完整的表格片段，不要把表头和数据挤在同一行
10. 不管什么结果一定要回复用户`,
    }) as unknown as IAgent;
  }
}
