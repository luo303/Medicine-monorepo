import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '@/entity/PurchaseOrder';
import { PurchaseDetail } from '@/entity/PurchaseDetail';
import { PurchaseStorage } from '@/entity/PurchaseStorage';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';
import {
  CreatePurchaseDetailDto,
  UpdatePurchaseDetailDto,
} from './dto/purchase-detail.dto';
import {
  CreatePurchaseStorageDto,
  UpdatePurchaseStorageDto,
} from './dto/purchase-storage.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseDetail)
    private readonly purchaseDetailRepository: Repository<PurchaseDetail>,
    @InjectRepository(PurchaseStorage)
    private readonly purchaseStorageRepository: Repository<PurchaseStorage>,
  ) {}

  // 采购订单 (PurchaseOrder) CRUD
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
      throw new NotFoundException('未找到该采购订单');
    }
    return order;
  }

  createOrder(createDto: CreatePurchaseOrderDto) {
    const order = this.purchaseOrderRepository.create(createDto);
    return this.purchaseOrderRepository.save(order);
  }

  async updateOrder(order_no: string, updateDto: UpdatePurchaseOrderDto) {
    const result = await this.purchaseOrderRepository.update(
      order_no,
      updateDto,
    );
    if (!result.affected) {
      throw new NotFoundException('未找到该采购订单，修改失败');
    }
    return this.findOneOrder(order_no);
  }

  async removeOrder(order_no: string) {
    const result = await this.purchaseOrderRepository.delete(order_no);
    if (!result.affected) {
      throw new NotFoundException('未找到该采购订单，删除失败');
    }
    return true;
  }

  // 采购明细 (PurchaseDetail) CRUD
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
      throw new NotFoundException('未找到该采购明细');
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
      throw new NotFoundException('未找到该采购明细，修改失败');
    }
    return this.findOneDetail(id);
  }

  async removeDetail(id: number) {
    const result = await this.purchaseDetailRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到该采购明细，删除失败');
    }
    return true;
  }

  // 采购入库 (PurchaseStorage) CRUD
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
      throw new NotFoundException('未找到该采购入库记录');
    }
    return storage;
  }

  createStorage(createDto: CreatePurchaseStorageDto) {
    const storage = this.purchaseStorageRepository.create(createDto);
    return this.purchaseStorageRepository.save(storage);
  }

  async updateStorage(id: number, updateDto: UpdatePurchaseStorageDto) {
    const result = await this.purchaseStorageRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到该采购入库记录，修改失败');
    }
    return this.findOneStorage(id);
  }

  async removeStorage(id: number) {
    const result = await this.purchaseStorageRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到该采购入库记录，删除失败');
    }
    return true;
  }
}
