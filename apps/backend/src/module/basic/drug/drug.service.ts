import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drug } from '@/entity/Drug';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';

@Injectable()
export class DrugService {
  constructor(
    @InjectRepository(Drug)
    private readonly drugRepository: Repository<Drug>,
  ) {}

  // 查询所有药品
  async findAll() {
    const drugs = await this.drugRepository.find();
    return drugs;
  }

  // 根据批准号查询药品
  async findOne(approval_no: string) {
    const drug = await this.drugRepository.findOne({ where: { approval_no } });
    if (!drug) {
      throw new NotFoundException('未找到该药品');
    }
    return drug;
  }

  // 新增药品
  async create(createDrugDto: CreateDrugDto) {
    const drug = this.drugRepository.create(createDrugDto);
    return this.drugRepository.save(drug);
  }

  // 更新药品
  async update(approval_no: string, updateDrugDto: UpdateDrugDto) {
    const result = await this.drugRepository.update(approval_no, updateDrugDto);
    if (!result.affected) {
      throw new NotFoundException('未找到该药品，修改失败');
    }
    return this.findOne(approval_no);
  }

  // 删除药品
  async remove(approval_no: string) {
    const result = await this.drugRepository.delete(approval_no);
    if (!result.affected) {
      throw new NotFoundException('未找到该药品，删除失败');
    }
    return true;
  }
}
