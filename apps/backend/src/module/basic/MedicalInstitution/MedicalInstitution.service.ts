import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalInstitution } from '@/entity/MedicalInstitution';
import { Repository } from 'typeorm';
import { CreateMedicalInstitutionDto } from './dto/create-medical-institution.dto';
import { UpdateMedicalInstitutionDto } from './dto/update-medical-institution.dto';

@Injectable()
export class MedicalInstitutionService {
  constructor(
    @InjectRepository(MedicalInstitution)
    private readonly medicalInstitutionRepository: Repository<MedicalInstitution>,
  ) {}

  // 查询所有医疗机构
  findAll() {
    return this.medicalInstitutionRepository.find();
  }

  // 根据批准号查询医疗机构
  async findOne(approval_no: string) {
    const institution = await this.medicalInstitutionRepository.findOne({
      where: { approval_no },
    });
    if (!institution) {
      throw new NotFoundException('未找到该医疗机构');
    }
    return institution;
  }

  // 创建医疗机构
  create(createDto: CreateMedicalInstitutionDto) {
    const institution = this.medicalInstitutionRepository.create(createDto);
    return this.medicalInstitutionRepository.save(institution);
  }

  // 更新医疗机构
  async update(approval_no: string, updateDto: UpdateMedicalInstitutionDto) {
    const result = await this.medicalInstitutionRepository.update(
      approval_no,
      updateDto,
    );
    if (!result.affected) {
      throw new NotFoundException('未找到该医疗机构，修改失败');
    }
    return this.findOne(approval_no);
  }

  // 删除医疗机构
  async remove(approval_no: string) {
    const result = await this.medicalInstitutionRepository.delete(approval_no);
    if (!result.affected) {
      throw new NotFoundException('未找到该医疗机构，删除失败');
    }
    return true;
  }
}
