import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '@/entity/SalesOrder';
import { SalesDetail } from '@/entity/SalesDetail';
import { SalesOutbound } from '@/entity/SalesOutbound';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
} from './dto/sales-order.dto';
import {
  CreateSalesDetailDto,
  UpdateSalesDetailDto,
} from './dto/sales-detail.dto';
import {
  CreateSalesOutboundDto,
  UpdateSalesOutboundDto,
} from './dto/sales-outbound.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(SalesDetail)
    private readonly salesDetailRepository: Repository<SalesDetail>,
    @InjectRepository(SalesOutbound)
    private readonly salesOutboundRepository: Repository<SalesOutbound>,
  ) {}

  // 销售订单 CRUD
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
      throw new NotFoundException('未找到该销售订单');
    }
    return order;
  }

  createOrder(createDto: CreateSalesOrderDto) {
    const order = this.salesOrderRepository.create(createDto);
    return this.salesOrderRepository.save(order);
  }

  async updateOrder(order_no: string, updateDto: UpdateSalesOrderDto) {
    const result = await this.salesOrderRepository.update(order_no, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到该销售订单，修改失败');
    }
    return this.findOneOrder(order_no);
  }

  async removeOrder(order_no: string) {
    const result = await this.salesOrderRepository.delete(order_no);
    if (!result.affected) {
      throw new NotFoundException('未找到该销售订单，删除失败');
    }
    return true;
  }

  // 销售明细 CRUD
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
      throw new NotFoundException('未找到该销售明细');
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
      throw new NotFoundException('未找到该销售明细，修改失败');
    }
    return this.findOneDetail(id);
  }

  async removeDetail(id: number) {
    const result = await this.salesDetailRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到该销售明细，删除失败');
    }
    return true;
  }

  // 销售出库 CRUD
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
      throw new NotFoundException('未找到该销售出库记录');
    }
    return outbound;
  }

  createOutbound(createDto: CreateSalesOutboundDto) {
    const outbound = this.salesOutboundRepository.create(createDto);
    return this.salesOutboundRepository.save(outbound);
  }

  async updateOutbound(id: number, updateDto: UpdateSalesOutboundDto) {
    const result = await this.salesOutboundRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到该销售出库记录，修改失败');
    }
    return this.findOneOutbound(id);
  }

  async removeOutbound(id: number) {
    const result = await this.salesOutboundRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到该销售出库记录，删除失败');
    }
    return true;
  }
}
