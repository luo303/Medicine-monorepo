import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '@/entity/Warehouse';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async findAll() {
    const warehouses = await this.warehouseRepository.find();
    return warehouses;
  }

  // 根据 ID 查询仓库
  async findOne(id: number) {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('未找到该仓库');
    }
    return warehouse;
  }

  // 根据编号查询仓库
  async findByCode(code: string) {
    return this.warehouseRepository.findOne({ where: { code } });
  }

  // 新增仓库
  async create(createDto: CreateWarehouseDto) {
    const warehouse = this.warehouseRepository.create(createDto);
    return this.warehouseRepository.save(warehouse);
  }

  // 更新仓库
  async update(id: number, updateDto: UpdateWarehouseDto) {
    const result = await this.warehouseRepository.update(id, updateDto);
    if (!result.affected) {
      throw new NotFoundException('未找到该仓库，修改失败');
    }
    return this.findOne(id);
  }

  // 删除仓库
  async remove(id: number) {
    const result = await this.warehouseRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('未找到该仓库，删除失败');
    }
    return true;
  }
}
