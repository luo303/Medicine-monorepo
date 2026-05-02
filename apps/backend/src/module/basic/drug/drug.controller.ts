import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { DrugService } from './drug.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import { Public } from '@/custom/Public';

@Controller('drug')
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Public()
  @Get()
  async findAll() {
    const drugs = await this.drugService.findAll();
    return {
      data: drugs,
      message: '获取药品列表成功',
    };
  }

  @Public()
  @Get(':approval_no')
  async findOne(@Param('approval_no') approval_no: string) {
    const drug = await this.drugService.findOne(approval_no);
    return {
      data: drug,
      message: drug ? '获取药品详情成功' : '未找到该药品',
    };
  }

  @Post()
  async create(@Body() createDrugDto: CreateDrugDto) {
    const drug = await this.drugService.create(createDrugDto);
    return {
      data: drug,
      message: '新增药品成功',
    };
  }

  @Put(':approval_no')
  async update(
    @Param('approval_no') approval_no: string,
    @Body() updateDrugDto: UpdateDrugDto,
  ) {
    const drug = await this.drugService.update(approval_no, updateDrugDto);
    return {
      data: drug,
      message: '修改药品成功',
    };
  }

  @Delete(':approval_no')
  async remove(@Param('approval_no') approval_no: string) {
    const result = await this.drugService.remove(approval_no);
    return {
      message: result ? '删除药品成功' : '未找到该药品，删除失败',
    };
  }
}
