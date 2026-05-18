import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOllama } from '@langchain/ollama';
import { createAgent } from 'langchain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '@/entity/Inventory';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { SalesOrder } from '@/entity/SalesOrder';
import { StorageLocation } from '@/entity/StorageLocation';
import { DrugService } from '../basic/drug/drug.service';
import { WarehouseService } from '../basic/warehouse/warehouse.service';
import { ManufacturerService } from '../basic/manufacturer/manufacturer.service';
import { MedicalInstitutionService } from '../basic/MedicalInstitution/MedicalInstitution.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { KnowledgeUserContext } from '../knowledge/knowledge.types';
import {
  createDrugTools,
  createInventoryTools,
  createKnowledgeTool,
  createManufacturerTools,
  createMedicalInstitutionTools,
  createPurchaseOrderTools,
  createSalesOrderTools,
  createStorageLocationTools,
  createWarehouseTools,
} from './tools';
import { IAgent } from './tools/tool.types';

@Injectable()
export class AiService {
  private readonly model: ChatOllama;

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
    private readonly configService: ConfigService,
  ) {
    this.model = new ChatOllama({
      model:
        this.configService.get<string>('AI.CHAT_MODEL') ?? 'gpt-oss:120b-cloud',
      temperature: 0,
    });
  }

  createAgent(user: KnowledgeUserContext): IAgent {
    const tools = [
      ...createDrugTools(this.drugService),
      ...createWarehouseTools(this.warehouseService),
      ...createInventoryTools(this.inventoryRepository),
      ...createManufacturerTools(this.manufacturerService),
      ...createMedicalInstitutionTools(this.medicalInstitutionService),
      ...createPurchaseOrderTools(this.purchaseOrderRepository),
      ...createSalesOrderTools(this.salesOrderRepository),
      ...createStorageLocationTools(this.storageLocationRepository),
      ...createKnowledgeTool(this.knowledgeService, user),
    ];

    return createAgent({
      model: this.model,
      tools,
      systemPrompt: `你是专业的医疗业务 AI 助手，回答必须基于工具返回的真实结果。

重要规则：
1. 当用户询问药品、仓库、库存、生产企业、医疗机构、采购订单、销售订单或货位相关问题时，必须调用对应工具获取数据。
2. 当用户询问已上传文件中的内容时，必须优先调用 query_knowledge_base 工具。
3. query_knowledge_base 已经自动按当前用户过滤私人和公共知识库，禁止跳过检索直接编造答案。
4. 如果无法确定用户指的是哪条数据，可以先调用查询工具查看候选项。
5. 回答要简洁、直接、可执行，不要杜撰没有检索到的信息。
6. 使用 Markdown 时必须保证格式完整；返回多列数据时使用完整表格，返回单条明细时优先使用项目列表。`,
    }) as unknown as IAgent;
  }
}
