import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '@/entity/Inventory';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  // 查询所有库存
  findAll() {
    return this.inventoryRepository.find({
      relations: ['drug', 'warehouse'],
    });
  }

  // 根据 ID 查询库存
  async findOne(id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['drug', 'warehouse'],
    });
    if (!inventory) {
      throw new NotFoundException('未找到该库存记录');
    }
    return inventory;
  }

  // 根据仓号、货位号、药品号、批号查询库存
  findByBatch(
    warehouse_code: string,
    location_code: string,
    drugApprovalNo: string,
    batch_no: string,
  ) {
    return this.inventoryRepository.findOne({
      where: {
        warehouse_code,
        location_code,
        drugApprovalNo,
        batch_no,
      },
      relations: ['drug', 'warehouse'],
    });
  }

  // 创建库存记录
  create(createDto: CreateInventoryDto) {
    const inventory = this.inventoryRepository.create(createDto);
    return this.inventoryRepository.save(inventory);
  }

  // 更新库存
  async update(id: number, updateDto: UpdateInventoryDto) {
    const result = await this.inventoryRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到该库存记录，修改失败');
    }
    return this.findOne(id);
  }

  // 删除库存记录
  async remove(id: number) {
    const result = await this.inventoryRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到该库存记录，删除失败');
    }
    return true;
  }
}
