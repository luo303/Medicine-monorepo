import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { MedicalInstitutionService } from './MedicalInstitution.service';
import { CreateMedicalInstitutionDto } from './dto/create-medical-institution.dto';
import { UpdateMedicalInstitutionDto } from './dto/update-medical-institution.dto';
import { Public } from '@/custom/Public';

@Controller('MedicalInstitution')
export class MedicalInstitutionController {
  constructor(
    private readonly medicalInstitutionService: MedicalInstitutionService,
  ) {}

  @Public()
  @Get()
  async findAll() {
    const medicalInstitutions = await this.medicalInstitutionService.findAll();
    return {
      data: medicalInstitutions,
      message: '获取医疗机构列表成功',
    };
  }

  @Public()
  @Get(':approval_no')
  async findOne(@Param('approval_no') approval_no: string) {
    const institution =
      await this.medicalInstitutionService.findOne(approval_no);
    return {
      data: institution,
      message: institution ? '获取医疗机构详情成功' : '未找到该医疗机构',
    };
  }

  @Post()
  async create(@Body() createDto: CreateMedicalInstitutionDto) {
    const institution = await this.medicalInstitutionService.create(createDto);
    return {
      data: institution,
      message: '新增医疗机构成功',
    };
  }

  @Put(':approval_no')
  async update(
    @Param('approval_no') approval_no: string,
    @Body() updateDto: UpdateMedicalInstitutionDto,
  ) {
    const institution = await this.medicalInstitutionService.update(
      approval_no,
      updateDto,
    );
    return {
      data: institution,
      message: '修改医疗机构成功',
    };
  }

  @Delete(':approval_no')
  async remove(@Param('approval_no') approval_no: string) {
    const result = await this.medicalInstitutionService.remove(approval_no);
    return {
      message: result ? '删除医疗机构成功' : '未找到该医疗机构，删除失败',
    };
  }
}
