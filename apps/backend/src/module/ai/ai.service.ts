import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  Annotation,
  Command,
  END,
  interrupt,
  MemorySaver,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
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
import { InventoryService } from '../basic/inventory/inventory.service';
import { StorageLocationService } from '../basic/storage-location/storage-location.service';
import { PurchaseService } from '../basic/purchase/purchase.service';
import { SalesService } from '../basic/sales/sales.service';
import {
  ApprovalDecision,
  ApprovalInterruptPayload,
  IAgent,
  MutationEntity,
  MutationOperation,
  PendingWriteAction,
  createDrugTools,
  createInventoryTools,
  createKnowledgeTool,
  createManufacturerTools,
  createMedicalInstitutionTools,
  createPurchaseOrderTools,
  createSalesOrderTools,
  createStorageLocationTools,
  createWarehouseTools,
  createWriteRequestTools,
  WRITE_TOOL_DEFINITIONS,
  WRITE_TOOL_NAMES,
} from './tools';

const AI_STATE = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  pendingWriteAction: Annotation<PendingWriteAction | null>({
    reducer: (_, right) => right,
    default: () => null,
  }),
  lastApproval: Annotation<{
    status: 'approved' | 'edited' | 'rejected';
    toolName: string;
    entity: MutationEntity;
    operation: MutationOperation;
    reason?: string;
  } | null>({
    reducer: (_, right) => right,
    default: () => null,
  }),
});

type AiState = typeof AI_STATE.State;

interface ApprovalReviewRequest {
  threadId: string;
  decision: ApprovalDecision;
}

interface ToolCallLike {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

interface MutationTargetLookup {
  target?: Record<string, unknown>;
  before?: unknown;
}

@Injectable()
export class AiService {
  private readonly model: ChatOpenAI;
  private readonly logger = new Logger(AiService.name);
  private readonly checkpointer = new MemorySaver();

  constructor(
    private readonly drugService: DrugService,
    private readonly warehouseService: WarehouseService,
    private readonly manufacturerService: ManufacturerService,
    private readonly medicalInstitutionService: MedicalInstitutionService,
    private readonly knowledgeService: KnowledgeService,
    private readonly inventoryService: InventoryService,
    private readonly storageLocationService: StorageLocationService,
    private readonly purchaseService: PurchaseService,
    private readonly salesService: SalesService,
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
    const readTools = [
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

    const writeRequestTools = createWriteRequestTools();
    const llmWithTools = this.model.bindTools([
      ...readTools,
      ...writeRequestTools,
    ]);
    const readToolNode = new ToolNode(readTools);

    const systemPrompt = [
      'You are a medical business AI assistant.',
      'Reply in the same language as the user unless they ask for another language.',
      'For questions about drugs, warehouses, inventory, manufacturers, medical institutions, purchase orders, sales orders, storage locations, or uploaded knowledge files, always answer from tool results first.',
      'If the user asks about uploaded document content, call query_knowledge_base first.',
      'Never fabricate database facts that are not returned by tools.',
      'When the user asks to create, update, or delete database records, you must use one of the request_* tools instead of pretending the change is already applied.',
      'If the target record is ambiguous, query candidate records first and only request a write after the target is clear.',
      'Only request one database write action at a time.',
      'Keep answers concise, direct, and actionable.',
    ].join('\n');

    const llmCall = async (state: AiState) => {
      const result = await llmWithTools.invoke([
        new SystemMessage(systemPrompt),
        ...state.messages,
      ]);

      return {
        messages: [result],
      };
    };

    const routeAfterLlm = (state: AiState) => {
      const lastMessage = state.messages.at(-1);
      const toolCalls = this.extractToolCalls(lastMessage);

      if (toolCalls.length === 0) {
        return END;
      }

      if (toolCalls.some((call) => WRITE_TOOL_NAMES.has(call.name))) {
        return 'reviewWriteNode';
      }

      return 'readToolNode';
    };

    const reviewWriteNode = async (state: AiState) => {
      const lastMessage = state.messages.at(-1);
      const toolCalls = this.extractToolCalls(lastMessage);
      const writeToolCall = toolCalls.find((call) =>
        WRITE_TOOL_NAMES.has(call.name),
      );

      if (!writeToolCall) {
        return {};
      }

      const definition = WRITE_TOOL_DEFINITIONS.find(
        (item) => item.name === writeToolCall.name,
      );

      if (!definition) {
        throw new Error(`Unsupported write tool: ${writeToolCall.name}`);
      }

      const lookup = await this.lookupMutationTarget(
        definition.entity,
        definition.operation,
        writeToolCall.args,
      );

      const pendingWriteAction: PendingWriteAction = {
        toolCallId: writeToolCall.id,
        toolName: writeToolCall.name,
        entity: definition.entity,
        operation: definition.operation,
        args: writeToolCall.args,
        target: lookup.target,
      };

      const interruptPayload: ApprovalInterruptPayload = {
        kind: 'db_write_review',
        toolCallId: writeToolCall.id,
        toolName: writeToolCall.name,
        entity: definition.entity,
        operation: definition.operation,
        summary: this.summarizeWriteAction(
          definition.entity,
          definition.operation,
          writeToolCall.args,
        ),
        args: writeToolCall.args,
        target: lookup.target,
        before: lookup.before,
      };

      const decision = interrupt(interruptPayload) as ApprovalDecision;

      if (decision.type === 'reject') {
        const message =
          decision.reason?.trim() ||
          'The requested database write was rejected during human review.';

        return {
          pendingWriteAction: null,
          lastApproval: {
            status: 'rejected',
            toolName: writeToolCall.name,
            entity: definition.entity,
            operation: definition.operation,
            reason: message,
          },
          messages: [
            new ToolMessage({
              tool_call_id: writeToolCall.id,
              content: JSON.stringify({
                approved: false,
                reason: message,
              }),
            }),
            new HumanMessage(
              `The write request "${writeToolCall.name}" was rejected by a reviewer. Feedback: ${message}`,
            ),
          ],
        };
      }

      const approvedArgs =
        decision.type === 'edit' ? decision.args : writeToolCall.args;

      return {
        pendingWriteAction: {
          ...pendingWriteAction,
          args: approvedArgs,
        },
        lastApproval: {
          status: decision.type === 'edit' ? 'edited' : 'approved',
          toolName: writeToolCall.name,
          entity: definition.entity,
          operation: definition.operation,
        },
      };
    };

    const routeAfterReview = (state: AiState) => {
      return state.pendingWriteAction ? 'executeWriteNode' : 'llmCall';
    };

    const executeWriteNode = async (state: AiState) => {
      const action = state.pendingWriteAction;

      if (!action) {
        return {};
      }

      const result = await this.executeWriteAction(action);

      return {
        pendingWriteAction: null,
        messages: [
          new ToolMessage({
            tool_call_id: action.toolCallId,
            content: JSON.stringify({
              approved: true,
              entity: action.entity,
              operation: action.operation,
              result,
            }),
          }),
        ],
      };
    };

    const compiled = new StateGraph(AI_STATE)
      .addNode('llmCall', llmCall)
      .addNode('readToolNode', readToolNode)
      .addNode('reviewWriteNode', reviewWriteNode)
      .addNode('executeWriteNode', executeWriteNode)
      .addEdge(START, 'llmCall')
      .addConditionalEdges('llmCall', routeAfterLlm, [
        'readToolNode',
        'reviewWriteNode',
        END,
      ])
      .addEdge('readToolNode', 'llmCall')
      .addConditionalEdges('reviewWriteNode', routeAfterReview, [
        'executeWriteNode',
        'llmCall',
      ])
      .addEdge('executeWriteNode', 'llmCall')
      .compile({
        checkpointer: this.checkpointer,
      }) as unknown as IAgent;

    return compiled;
  }

  createThreadId(userId: number) {
    return `ai-review:${userId}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  async resumeAgent(
    user: KnowledgeUserContext,
    request: ApprovalReviewRequest,
  ) {
    const agent = this.createAgent(user);

    return agent.stream(new Command({ resume: request.decision }), {
      streamMode: ['updates', 'messages'],
      recursionLimit: 8,
      configurable: {
        thread_id: request.threadId,
      },
    });
  }

  private extractToolCalls(message: BaseMessage | undefined): ToolCallLike[] {
    if (!message || !('tool_calls' in message)) {
      return [];
    }

    const toolCalls = (message as AIMessage & { tool_calls?: ToolCallLike[] })
      .tool_calls;

    return Array.isArray(toolCalls) ? toolCalls : [];
  }

  private summarizeWriteAction(
    entity: MutationEntity,
    operation: MutationOperation,
    args: Record<string, unknown>,
  ) {
    const targetPart = (() => {
      if ('approval_no' in args && typeof args.approval_no === 'string') {
        return ` target=${args.approval_no}`;
      }

      if ('id' in args && typeof args.id !== 'undefined') {
        return ` target=${String(args.id)}`;
      }

      if ('order_no' in args && typeof args.order_no === 'string') {
        return ` target=${args.order_no}`;
      }

      return '';
    })();

    return `${operation} ${entity}${targetPart}`;
  }

  private async lookupMutationTarget(
    entity: MutationEntity,
    operation: MutationOperation,
    args: Record<string, unknown>,
  ): Promise<MutationTargetLookup> {
    if (operation === 'create') {
      return {};
    }

    try {
      switch (entity) {
        case 'drug': {
          const approvalNo = this.requireString(
            args.approval_no,
            'approval_no',
          );
          const current = await this.drugService.findOne(approvalNo);
          return {
            target: {
              approval_no: current.approval_no,
              name: current.name,
            },
            before: current,
          };
        }
        case 'warehouse': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.warehouseService.findOne(id);
          return {
            target: { id: current.id, code: current.code, name: current.name },
            before: current,
          };
        }
        case 'manufacturer': {
          const approvalNo = this.requireString(
            args.approval_no,
            'approval_no',
          );
          const current = await this.manufacturerService.findOne(approvalNo);
          return {
            target: {
              approval_no: current.approval_no,
              name: current.name,
            },
            before: current,
          };
        }
        case 'medical_institution': {
          const approvalNo = this.requireString(
            args.approval_no,
            'approval_no',
          );
          const current =
            await this.medicalInstitutionService.findOne(approvalNo);
          return {
            target: {
              approval_no: current.approval_no,
              name: current.name,
            },
            before: current,
          };
        }
        case 'storage_location': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.storageLocationService.findOne(id);
          return {
            target: { id: current.id, code: current.code },
            before: current,
          };
        }
        case 'inventory': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.inventoryService.findOne(id);
          return {
            target: {
              id: current.id,
              warehouse_code: current.warehouse_code,
              location_code: current.location_code,
              drugApprovalNo: current.drugApprovalNo,
            },
            before: current,
          };
        }
        case 'purchase_order': {
          const orderNo = this.requireString(args.order_no, 'order_no');
          const current = await this.purchaseService.findOneOrder(orderNo);
          return {
            target: {
              order_no: current.order_no,
              manufacturer_name: current.manufacturer_name,
              status: current.status,
            },
            before: current,
          };
        }
        case 'sales_order': {
          const orderNo = this.requireString(args.order_no, 'order_no');
          const current = await this.salesService.findOneOrder(orderNo);
          return {
            target: {
              order_no: current.order_no,
              institution_name: current.institution_name,
              status: current.status,
            },
            before: current,
          };
        }
        case 'purchase_detail': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.purchaseService.findOneDetail(id);
          return {
            target: {
              id: current.id,
              order_no: current.orderNo,
              drug_name: current.drug_name,
            },
            before: current,
          };
        }
        case 'sales_detail': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.salesService.findOneDetail(id);
          return {
            target: {
              id: current.id,
              order_no: current.orderNo,
              drug_name: current.drug_name,
            },
            before: current,
          };
        }
        case 'purchase_storage': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.purchaseService.findOneStorage(id);
          return {
            target: {
              id: current.id,
              order_no: current.orderNo,
              drug_name: current.drug_name,
            },
            before: current,
          };
        }
        case 'sales_outbound': {
          const id = this.requireNumber(args.id, 'id');
          const current = await this.salesService.findOneOutbound(id);
          return {
            target: {
              id: current.id,
              order_no: current.orderNo,
              drug_name: current.drug_name,
            },
            before: current,
          };
        }
        default:
          return {};
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.warn(
        `Failed to look up mutation target for ${entity}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {};
    }
  }

  private async executeWriteAction(action: PendingWriteAction) {
    switch (action.entity) {
      case 'drug':
        return this.executeDrugWrite(action);
      case 'warehouse':
        return this.executeWarehouseWrite(action);
      case 'manufacturer':
        return this.executeManufacturerWrite(action);
      case 'medical_institution':
        return this.executeMedicalInstitutionWrite(action);
      case 'storage_location':
        return this.executeStorageLocationWrite(action);
      case 'inventory':
        return this.executeInventoryWrite(action);
      case 'purchase_order':
        return this.executePurchaseOrderWrite(action);
      case 'sales_order':
        return this.executeSalesOrderWrite(action);
      case 'purchase_detail':
        return this.executePurchaseDetailWrite(action);
      case 'sales_detail':
        return this.executeSalesDetailWrite(action);
      case 'purchase_storage':
        return this.executePurchaseStorageWrite(action);
      case 'sales_outbound':
        return this.executeSalesOutboundWrite(action);
      default:
        throw new Error(`Unsupported write entity: ${action.entity}`);
    }
  }

  private async executeDrugWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.drugService.create(action.args as any);
    }

    if (action.operation === 'update') {
      const approvalNo = this.requireString(
        action.args.approval_no,
        'approval_no',
      );
      const data = this.requireObject(action.args.data, 'data');
      return this.drugService.update(approvalNo, data as any);
    }

    const approvalNo = this.requireString(
      action.args.approval_no,
      'approval_no',
    );
    await this.drugService.remove(approvalNo);
    return { deleted: true, approval_no: approvalNo };
  }

  private async executeWarehouseWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.warehouseService.create(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.warehouseService.update(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.warehouseService.remove(id);
    return { deleted: true, id };
  }

  private async executeManufacturerWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.manufacturerService.create(action.args as any);
    }

    if (action.operation === 'update') {
      const approvalNo = this.requireString(
        action.args.approval_no,
        'approval_no',
      );
      const data = this.requireObject(action.args.data, 'data');
      return this.manufacturerService.update(approvalNo, data as any);
    }

    const approvalNo = this.requireString(
      action.args.approval_no,
      'approval_no',
    );
    await this.manufacturerService.remove(approvalNo);
    return { deleted: true, approval_no: approvalNo };
  }

  private async executeMedicalInstitutionWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.medicalInstitutionService.create(action.args as any);
    }

    if (action.operation === 'update') {
      const approvalNo = this.requireString(
        action.args.approval_no,
        'approval_no',
      );
      const data = this.requireObject(action.args.data, 'data');
      return this.medicalInstitutionService.update(approvalNo, data as any);
    }

    const approvalNo = this.requireString(
      action.args.approval_no,
      'approval_no',
    );
    await this.medicalInstitutionService.remove(approvalNo);
    return { deleted: true, approval_no: approvalNo };
  }

  private async executeStorageLocationWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.storageLocationService.create(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.storageLocationService.update(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.storageLocationService.remove(id);
    return { deleted: true, id };
  }

  private async executeInventoryWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.inventoryService.create(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.inventoryService.update(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.inventoryService.remove(id);
    return { deleted: true, id };
  }

  private async executePurchaseOrderWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.purchaseService.createOrder(action.args as any);
    }

    if (action.operation === 'update') {
      const orderNo = this.requireString(action.args.order_no, 'order_no');
      const data = this.requireObject(action.args.data, 'data');
      return this.purchaseService.updateOrder(orderNo, data as any);
    }

    const orderNo = this.requireString(action.args.order_no, 'order_no');
    await this.purchaseService.removeOrder(orderNo);
    return { deleted: true, order_no: orderNo };
  }

  private async executeSalesOrderWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.salesService.createOrder(action.args as any);
    }

    if (action.operation === 'update') {
      const orderNo = this.requireString(action.args.order_no, 'order_no');
      const data = this.requireObject(action.args.data, 'data');
      return this.salesService.updateOrder(orderNo, data as any);
    }

    const orderNo = this.requireString(action.args.order_no, 'order_no');
    await this.salesService.removeOrder(orderNo);
    return { deleted: true, order_no: orderNo };
  }

  private async executePurchaseDetailWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.purchaseService.createDetail(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.purchaseService.updateDetail(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.purchaseService.removeDetail(id);
    return { deleted: true, id };
  }

  private async executeSalesDetailWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.salesService.createDetail(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.salesService.updateDetail(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.salesService.removeDetail(id);
    return { deleted: true, id };
  }

  private async executePurchaseStorageWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.purchaseService.createStorage(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.purchaseService.updateStorage(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.purchaseService.removeStorage(id);
    return { deleted: true, id };
  }

  private async executeSalesOutboundWrite(action: PendingWriteAction) {
    if (action.operation === 'create') {
      return this.salesService.createOutbound(action.args as any);
    }

    if (action.operation === 'update') {
      const id = this.requireNumber(action.args.id, 'id');
      const data = this.requireObject(action.args.data, 'data');
      return this.salesService.updateOutbound(id, data as any);
    }

    const id = this.requireNumber(action.args.id, 'id');
    await this.salesService.removeOutbound(id);
    return { deleted: true, id };
  }

  private requireString(value: unknown, field: string) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Invalid string field: ${field}`);
    }

    return value;
  }

  private requireNumber(value: unknown, field: string) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`Invalid number field: ${field}`);
    }

    return value;
  }

  private requireObject(value: unknown, field: string) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Invalid object field: ${field}`);
    }

    return value as Record<string, unknown>;
  }
}
