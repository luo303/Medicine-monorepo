import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { SystemMessage } from '@langchain/core/messages';
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
  private readonly model: ChatOpenAI;

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
    const apiKey = this.configService.get<string>('AI.ZHIPU_API_KEY')?.trim();

    if (!apiKey) {
      throw new Error(
        'AI.ZHIPU_API_KEY is required for chat. Please fill it in the backend config.',
      );
    }

    const baseURL =
      this.configService.get<string>('AI.ZHIPU_BASE_URL')?.trim() ||
      'https://open.bigmodel.cn/api/paas/v4/';

    this.model = new ChatOpenAI({
      model: this.configService.get<string>('AI.CHAT_MODEL') ?? 'glm-4.7-flash',
      apiKey,
      temperature: 0,
      streamUsage: false,
      configuration: {
        baseURL,
      },
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

    const llmWithTools = this.model.bindTools(tools);
    const toolNode = new ToolNode(tools);

    const systemPrompt = [
      'You are a medical business AI assistant.',
      'Reply in the same language as the user unless they ask for another language.',
      'For questions about drugs, warehouses, inventory, manufacturers, medical institutions, purchase orders, sales orders, storage locations, or uploaded knowledge files, always answer from tool results first.',
      'If the user asks about uploaded document content, call query_knowledge_base first.',
      'Do not invent facts that are not returned by tools.',
      'If the target record is ambiguous, query candidate records first and then answer.',
      'Keep answers concise, direct, and actionable.',
    ].join('\n');

    const llmCall = async (state: typeof MessagesAnnotation.State) => {
      const result = await llmWithTools.invoke([
        new SystemMessage(systemPrompt),
        ...state.messages,
      ]);

      return {
        messages: [result],
      };
    };

    const shouldContinue = (state: typeof MessagesAnnotation.State) => {
      const lastMessage = state.messages.at(-1);
      const toolCalls =
        lastMessage && 'tool_calls' in lastMessage
          ? lastMessage.tool_calls
          : undefined;

      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        return 'toolNode';
      }

      return END;
    };

    return new StateGraph(MessagesAnnotation)
      .addNode('llmCall', llmCall)
      .addNode('toolNode', toolNode)
      .addEdge(START, 'llmCall')
      .addConditionalEdges('llmCall', shouldContinue, ['toolNode', END])
      .addEdge('toolNode', 'llmCall')
      .compile() as unknown as IAgent;
  }
}
