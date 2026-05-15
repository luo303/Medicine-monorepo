import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from '@/entity/PurchaseOrder';
import { PurchaseDetail } from '@/entity/PurchaseDetail';
import { PurchaseStorage } from '@/entity/PurchaseStorage';
import { Inventory } from '@/entity/Inventory';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';
import {
  CreatePurchaseDetailDto,
  UpdatePurchaseDetailDto,
} from './dto/purchase-detail.dto';
import { UpdatePurchaseStorageDto } from './dto/purchase-storage.dto';
import { SubmitPurchaseStorageDto } from './dto/submit-purchase-storage.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseDetail)
    private readonly purchaseDetailRepository: Repository<PurchaseDetail>,
    @InjectRepository(PurchaseStorage)
    private readonly purchaseStorageRepository: Repository<PurchaseStorage>,
    private readonly dataSource: DataSource,
  ) {}

  findAllOrders() {
    return this.purchaseOrderRepository.find({
      relations: ['purchaseDetails', 'purchaseStorages', 'manufacturer'],
    });
  }

  async findOneOrder(order_no: string) {
    const order = await this.purchaseOrderRepository.findOne({
      where: { order_no },
      relations: ['purchaseDetails', 'purchaseStorages', 'manufacturer'],
    });

    if (!order) {
      throw new NotFoundException('未找到采购订单');
    }

    return order;
  }

  async createOrder(createDto: CreatePurchaseOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const { purchaseDetails, ...orderPayload } = createDto;
      const totalAmount = purchaseDetails.reduce(
        (sum, detail) => sum + detail.quantity * detail.unit_price,
        0,
      );

      const order = manager.create(PurchaseOrder, {
        ...orderPayload,
        total_amount: totalAmount,
        status: PurchaseOrderStatus.PENDING,
      });
      await manager.save(PurchaseOrder, order);

      const details = purchaseDetails.map((detail) =>
        manager.create(PurchaseDetail, {
          ...detail,
          orderNo: order.order_no,
        }),
      );
      await manager.save(PurchaseDetail, details);

      return this.findOrderInManager(manager, order.order_no);
    });
  }

  async updateOrder(order_no: string, updateDto: UpdatePurchaseOrderDto) {
    const result = await this.purchaseOrderRepository.update(
      order_no,
      updateDto,
    );
    if (!result.affected) {
      throw new NotFoundException('未找到采购订单');
    }
    return this.findOneOrder(order_no);
  }

  async removeOrder(order_no: string) {
    const result = await this.purchaseOrderRepository.delete(order_no);
    if (!result.affected) {
      throw new NotFoundException('未找到采购订单');
    }
    return true;
  }

  findAllDetails() {
    return this.purchaseDetailRepository.find({
      relations: ['purchaseOrder', 'drug'],
    });
  }

  async findOneDetail(id: number) {
    const detail = await this.purchaseDetailRepository.findOne({
      where: { id },
      relations: ['purchaseOrder', 'drug'],
    });
    if (!detail) {
      throw new NotFoundException('未找到采购明细');
    }
    return detail;
  }

  createDetail(createDto: CreatePurchaseDetailDto) {
    const detail = this.purchaseDetailRepository.create(createDto);
    return this.purchaseDetailRepository.save(detail);
  }

  async updateDetail(id: number, updateDto: UpdatePurchaseDetailDto) {
    const result = await this.purchaseDetailRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到采购明细');
    }
    return this.findOneDetail(id);
  }

  async removeDetail(id: number) {
    const result = await this.purchaseDetailRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到采购明细');
    }
    return true;
  }

  findAllStorages() {
    return this.purchaseStorageRepository.find({
      relations: ['purchaseOrder', 'drug', 'manufacturer'],
    });
  }

  async findOneStorage(id: number) {
    const storage = await this.purchaseStorageRepository.findOne({
      where: { id },
      relations: ['purchaseOrder', 'drug', 'manufacturer'],
    });
    if (!storage) {
      throw new NotFoundException('未找到采购入库记录');
    }
    return storage;
  }

  async createStorage(createDto: SubmitPurchaseStorageDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(PurchaseOrder, {
        where: { order_no: createDto.orderNo },
        relations: ['purchaseDetails'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('未找到采购订单');
      }

      if (
        order.status !== PurchaseOrderStatus.APPROVED &&
        order.status !== PurchaseOrderStatus.PARTIAL
      ) {
        throw new BadRequestException(
          '只有已审核或部分入库的采购订单才能执行入库',
        );
      }

      if (!order.purchaseDetails.length) {
        throw new BadRequestException('采购订单没有明细，无法入库');
      }

      const detailMap = new Map(
        order.purchaseDetails.map((detail) => [detail.id, detail]),
      );
      const existingStorages = await manager.find(PurchaseStorage, {
        where: { orderNo: order.order_no },
      });

      const storedTotals = new Map<string, number>();
      for (const storage of existingStorages) {
        const key = this.getPurchaseDetailKey(storage);
        storedTotals.set(key, (storedTotals.get(key) ?? 0) + storage.quantity);
      }

      const inventoryMap = new Map<string, Inventory>();
      const createdStorages: PurchaseStorage[] = [];

      for (const entry of createDto.entries) {
        const detail = detailMap.get(entry.detailId);
        if (!detail) {
          throw new BadRequestException(
            `采购明细 ${entry.detailId} 不属于采购单 ${order.order_no}`,
          );
        }

        const detailKey = this.getPurchaseDetailKey(detail);
        const nextStoredTotal =
          (storedTotals.get(detailKey) ?? 0) + entry.quantity;

        if (nextStoredTotal > detail.quantity) {
          throw new BadRequestException(
            `${detail.drug_name} 的入库数量不能超过订单剩余可入库数量`,
          );
        }

        storedTotals.set(detailKey, nextStoredTotal);

        const batchNo = this.normalizeBatchNo(entry.batch_no);
        const expiryDate = this.addMonths(
          detail.production_date,
          detail.validity_months,
        );

        createdStorages.push(
          manager.create(PurchaseStorage, {
            warehouse_code: entry.warehouse_code,
            location_code: entry.location_code,
            orderNo: order.order_no,
            storage_date: createDto.storage_date,
            manufacturerApprovalNo: order.manufacturerApprovalNo,
            drugApprovalNo: detail.drugApprovalNo,
            drug_name: detail.drug_name,
            production_date: detail.production_date,
            expiry_date: expiryDate,
            quantity: entry.quantity,
            purchaser: order.purchaser,
            inspector: createDto.inspector,
            keeper: createDto.keeper,
            batch_no: batchNo ?? undefined,
          }),
        );

        const inventoryKey = this.getInventoryKey(
          entry.warehouse_code,
          entry.location_code,
          detail.drugApprovalNo,
          detail.production_date,
          batchNo,
        );

        let inventory = inventoryMap.get(inventoryKey);
        if (!inventory) {
          const inventoryWhere: FindOptionsWhere<Inventory> = {
            warehouse_code: entry.warehouse_code,
            location_code: entry.location_code,
            drugApprovalNo: detail.drugApprovalNo,
            production_date: detail.production_date,
            batch_no: batchNo ?? IsNull(),
          };

          const existingInventory = await manager.findOne(Inventory, {
            where: inventoryWhere,
            lock: { mode: 'pessimistic_write' },
          });

          inventory =
            existingInventory ??
            manager.create(Inventory, {
              warehouse_code: entry.warehouse_code,
              location_code: entry.location_code,
              manufacturerApprovalNo: order.manufacturerApprovalNo,
              drugApprovalNo: detail.drugApprovalNo,
              drug_name: detail.drug_name,
              batch_no: batchNo ?? undefined,
              production_date: detail.production_date,
              expiry_date: expiryDate,
              quantity: 0,
            });

          inventoryMap.set(inventoryKey, inventory);
        }

        inventory.manufacturerApprovalNo = order.manufacturerApprovalNo;
        inventory.drug_name = detail.drug_name;
        inventory.expiry_date = expiryDate;
        inventory.quantity += entry.quantity;
      }

      const savedStorages = await manager.save(
        PurchaseStorage,
        createdStorages,
      );
      await manager.save(Inventory, Array.from(inventoryMap.values()));

      const nextStatus = order.purchaseDetails.every((detail) => {
        const totalStored =
          storedTotals.get(this.getPurchaseDetailKey(detail)) ?? 0;
        return totalStored >= detail.quantity;
      })
        ? PurchaseOrderStatus.COMPLETE
        : PurchaseOrderStatus.PARTIAL;

      if (order.status !== nextStatus) {
        order.status = nextStatus;
        await manager.save(PurchaseOrder, order);
      }

      return manager.find(PurchaseStorage, {
        where: { id: In(savedStorages.map((storage) => storage.id)) },
        relations: ['purchaseOrder', 'drug', 'manufacturer'],
      });
    });
  }

  async updateStorage(id: number, updateDto: UpdatePurchaseStorageDto) {
    const result = await this.purchaseStorageRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到采购入库记录');
    }
    return this.findOneStorage(id);
  }

  async removeStorage(id: number) {
    const result = await this.purchaseStorageRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到采购入库记录');
    }
    return true;
  }

  private async findOrderInManager(manager: EntityManager, orderNo: string) {
    const order = await manager.findOne(PurchaseOrder, {
      where: { order_no: orderNo },
      relations: ['purchaseDetails', 'purchaseStorages', 'manufacturer'],
    });

    if (!order) {
      throw new NotFoundException('未找到采购订单');
    }

    return order;
  }

  private getPurchaseDetailKey(detail: {
    drugApprovalNo: string;
    production_date: string | Date;
  }) {
    return `${detail.drugApprovalNo}|${this.toDateKey(detail.production_date)}`;
  }

  private getInventoryKey(
    warehouseCode: string,
    locationCode: string,
    drugApprovalNo: string,
    productionDate: string | Date,
    batchNo: string | null,
  ) {
    return [
      warehouseCode,
      locationCode,
      drugApprovalNo,
      this.toDateKey(productionDate),
      batchNo ?? '',
    ].join('|');
  }

  private normalizeBatchNo(batchNo?: string | null) {
    const normalized = batchNo?.trim();
    return normalized ? normalized : null;
  }

  private toDateKey(value: string | Date) {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return value.toISOString().slice(0, 10);
  }

  private addMonths(value: string | Date, months: number) {
    const date =
      typeof value === 'string'
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
    date.setMonth(date.getMonth() + months);
    return date;
  }
}
