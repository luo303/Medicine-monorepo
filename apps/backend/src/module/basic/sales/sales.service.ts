import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from '@/entity/SalesOrder';
import { SalesDetail } from '@/entity/SalesDetail';
import { SalesOutbound } from '@/entity/SalesOutbound';
import { Inventory } from '@/entity/Inventory';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
} from './dto/sales-order.dto';
import {
  CreateSalesDetailDto,
  UpdateSalesDetailDto,
} from './dto/sales-detail.dto';
import { UpdateSalesOutboundDto } from './dto/sales-outbound.dto';
import { SubmitSalesOutboundDto } from './dto/submit-sales-outbound.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(SalesDetail)
    private readonly salesDetailRepository: Repository<SalesDetail>,
    @InjectRepository(SalesOutbound)
    private readonly salesOutboundRepository: Repository<SalesOutbound>,
    private readonly dataSource: DataSource,
  ) {}

  findAllOrders() {
    return this.salesOrderRepository.find({
      relations: ['institution', 'salesDetails'],
    });
  }

  async findOneOrder(order_no: string) {
    const order = await this.salesOrderRepository.findOne({
      where: { order_no },
      relations: ['institution', 'salesDetails', 'salesDetails.drug'],
    });
    if (!order) {
      throw new NotFoundException('未找到销售订单');
    }
    return order;
  }

  async createOrder(createDto: CreateSalesOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const { salesDetails = [], ...orderPayload } = createDto;

      const order = manager.create(SalesOrder, orderPayload);
      await manager.save(SalesOrder, order);

      if (salesDetails.length) {
        const details = salesDetails.map((detail) =>
          manager.create(SalesDetail, {
            ...detail,
            orderNo: order.order_no,
          }),
        );
        await manager.save(SalesDetail, details);
      }

      return this.findOrderInManager(manager, order.order_no);
    });
  }

  async updateOrder(order_no: string, updateDto: UpdateSalesOrderDto) {
    const result = await this.salesOrderRepository.update(order_no, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到销售订单');
    }
    return this.findOneOrder(order_no);
  }

  async removeOrder(order_no: string) {
    const result = await this.salesOrderRepository.delete(order_no);
    if (!result.affected) {
      throw new NotFoundException('未找到销售订单');
    }
    return true;
  }

  findAllDetails() {
    return this.salesDetailRepository.find({
      relations: ['salesOrder', 'drug'],
    });
  }

  async findOneDetail(id: number) {
    const detail = await this.salesDetailRepository.findOne({
      where: { id },
      relations: ['salesOrder', 'drug'],
    });
    if (!detail) {
      throw new NotFoundException('未找到销售明细');
    }
    return detail;
  }

  createDetail(createDto: CreateSalesDetailDto) {
    const detail = this.salesDetailRepository.create(createDto);
    return this.salesDetailRepository.save(detail);
  }

  async updateDetail(id: number, updateDto: UpdateSalesDetailDto) {
    const result = await this.salesDetailRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到销售明细');
    }
    return this.findOneDetail(id);
  }

  async removeDetail(id: number) {
    const result = await this.salesDetailRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到销售明细');
    }
    return true;
  }

  findAllOutbounds() {
    return this.salesOutboundRepository.find({
      relations: ['salesOrder', 'institution', 'drug'],
    });
  }

  async findOneOutbound(id: number) {
    const outbound = await this.salesOutboundRepository.findOne({
      where: { id },
      relations: ['salesOrder', 'institution', 'drug'],
    });
    if (!outbound) {
      throw new NotFoundException('未找到销售出库记录');
    }
    return outbound;
  }

  async createOutbound(createDto: SubmitSalesOutboundDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(SalesOrder, {
        where: { order_no: createDto.orderNo },
        relations: ['salesDetails'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('未找到销售订单');
      }

      if (
        order.status !== SalesOrderStatus.APPROVED &&
        order.status !== SalesOrderStatus.PARTIAL
      ) {
        throw new BadRequestException(
          '只有已审核或部分出库的销售订单才能执行出库',
        );
      }

      if (!order.salesDetails.length) {
        throw new BadRequestException('销售订单没有明细，无法出库');
      }

      const detailMap = new Map(
        order.salesDetails.map((detail) => [detail.id, detail]),
      );
      const existingOutbounds = await manager.find(SalesOutbound, {
        where: { orderNo: order.order_no },
      });
      const outboundTotals = new Map<string, number>();
      for (const outbound of existingOutbounds) {
        const key = this.getSalesDetailKey(outbound);
        outboundTotals.set(
          key,
          (outboundTotals.get(key) ?? 0) + outbound.quantity,
        );
      }

      const lockedInventories = new Map<number, Inventory>();
      const createdOutbounds: SalesOutbound[] = [];

      for (const entry of createDto.entries) {
        const detail = detailMap.get(entry.detailId);
        if (!detail) {
          throw new BadRequestException(
            `销售明细 ${entry.detailId} 不属于销售单 ${order.order_no}`,
          );
        }

        const detailKey = this.getSalesDetailKey(detail);
        const nextOutboundTotal =
          (outboundTotals.get(detailKey) ?? 0) + entry.quantity;

        if (nextOutboundTotal > detail.quantity) {
          throw new BadRequestException(
            `${detail.drug_name} 的出库数量不能超过订单剩余待出库数量`,
          );
        }

        outboundTotals.set(detailKey, nextOutboundTotal);

        let inventory = lockedInventories.get(entry.inventoryId);
        if (!inventory) {
          const existingInventory = await manager.findOne(Inventory, {
            where: { id: entry.inventoryId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!existingInventory) {
            throw new NotFoundException(`未找到库存记录 ${entry.inventoryId}`);
          }

          inventory = existingInventory;
          lockedInventories.set(entry.inventoryId, inventory);
        }

        if (!this.inventoryMatchesDetail(inventory, detail)) {
          throw new BadRequestException(
            `${detail.drug_name} 选择的库存来源与销售明细不匹配`,
          );
        }

        if (entry.quantity > inventory.quantity) {
          throw new BadRequestException(
            `${detail.drug_name} 的出库数量不能超过当前可用库存`,
          );
        }

        inventory.quantity -= entry.quantity;

        createdOutbounds.push(
          manager.create(SalesOutbound, {
            warehouse_code: inventory.warehouse_code,
            location_code: inventory.location_code,
            orderNo: order.order_no,
            outbound_date: createDto.outbound_date,
            institutionApprovalNo: order.institutionApprovalNo,
            manufacturerApprovalNo: detail.manufacturerApprovalNo,
            drugApprovalNo: detail.drugApprovalNo,
            drug_name: detail.drug_name,
            production_date: detail.production_date,
            quantity: entry.quantity,
            salesperson: order.salesperson,
            inspector: createDto.inspector,
            keeper: createDto.keeper,
          }),
        );
      }

      const savedOutbounds = await manager.save(
        SalesOutbound,
        createdOutbounds,
      );
      await manager.save(Inventory, Array.from(lockedInventories.values()));

      const nextStatus = order.salesDetails.every((detail) => {
        const totalOutbound =
          outboundTotals.get(this.getSalesDetailKey(detail)) ?? 0;
        return totalOutbound >= detail.quantity;
      })
        ? SalesOrderStatus.COMPLETE
        : SalesOrderStatus.PARTIAL;

      if (order.status !== nextStatus) {
        order.status = nextStatus;
        await manager.save(SalesOrder, order);
      }

      return manager.find(SalesOutbound, {
        where: { id: In(savedOutbounds.map((outbound) => outbound.id)) },
        relations: ['salesOrder', 'institution', 'drug'],
      });
    });
  }

  async updateOutbound(id: number, updateDto: UpdateSalesOutboundDto) {
    const result = await this.salesOutboundRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到销售出库记录');
    }
    return this.findOneOutbound(id);
  }

  async removeOutbound(id: number) {
    const result = await this.salesOutboundRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到销售出库记录');
    }
    return true;
  }

  private async findOrderInManager(manager: EntityManager, orderNo: string) {
    const order = await manager.findOne(SalesOrder, {
      where: { order_no: orderNo },
      relations: ['institution', 'salesDetails', 'salesDetails.drug'],
    });

    if (!order) {
      throw new NotFoundException('未找到销售订单');
    }

    return order;
  }

  private getSalesDetailKey(detail: {
    manufacturerApprovalNo?: string;
    drugApprovalNo: string;
    production_date: string | Date;
  }) {
    return [
      detail.manufacturerApprovalNo ?? '',
      detail.drugApprovalNo,
      this.toDateKey(detail.production_date),
    ].join('|');
  }

  private inventoryMatchesDetail(inventory: Inventory, detail: SalesDetail) {
    return (
      inventory.drugApprovalNo === detail.drugApprovalNo &&
      (inventory.manufacturerApprovalNo ?? '') ===
        (detail.manufacturerApprovalNo ?? '') &&
      this.toDateKey(inventory.production_date) ===
        this.toDateKey(detail.production_date)
    );
  }

  private toDateKey(value: string | Date) {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return value.toISOString().slice(0, 10);
  }
}
