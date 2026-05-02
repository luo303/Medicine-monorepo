import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Manufacturer } from '@/entity/Manufacturer';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';

@Injectable()
export class ManufacturerService {
  constructor(
    @InjectRepository(Manufacturer)
    private readonly manufacturerRepository: Repository<Manufacturer>,
  ) {}

  async findAll(): Promise<Manufacturer[]> {
    const manufacturers = await this.manufacturerRepository.find();
    return manufacturers;
  }

  // 根据批准号查询生产企业
  async findOne(approval_no: string): Promise<Manufacturer> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { approval_no },
    });
    if (!manufacturer) {
      throw new NotFoundException('未找到该生产企业');
    }
    return manufacturer;
  }

  // 新增生产企业
  async create(createDto: CreateManufacturerDto): Promise<Manufacturer> {
    const manufacturer = this.manufacturerRepository.create(createDto);
    return this.manufacturerRepository.save(manufacturer);
  }

  // 更新生产企业
  async update(
    approval_no: string,
    updateDto: UpdateManufacturerDto,
  ): Promise<Manufacturer> {
    const result = await this.manufacturerRepository.update(
      approval_no,
      updateDto,
    );
    if (!result.affected) {
      throw new NotFoundException('未找到该生产企业，修改失败');
    }
    return this.findOne(approval_no);
  }

  // 删除生产企业
  async remove(approval_no: string): Promise<boolean> {
    const result = await this.manufacturerRepository.delete(approval_no);
    if (!result.affected) {
      throw new NotFoundException('未找到该生产企业，删除失败');
    }
    return true;
  }
}
