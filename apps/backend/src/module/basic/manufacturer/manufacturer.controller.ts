import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ManufacturerService } from './manufacturer.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { Public } from '@/custom/Public';

@Controller('manufacturer')
export class ManufacturerController {
  constructor(private readonly manufacturerService: ManufacturerService) {}

  @Public()
  @Get()
  async findAll() {
    const manufacturers = await this.manufacturerService.findAll();
    return {
      data: manufacturers,
      message: '获取制造商列表成功',
    };
  }

  @Public()
  @Get(':approval_no')
  async findOne(@Param('approval_no') approval_no: string) {
    const manufacturer = await this.manufacturerService.findOne(approval_no);
    return {
      data: manufacturer,
      message: manufacturer ? '获取制造商详情成功' : '未找到该制造商',
    };
  }

  @Post()
  async create(@Body() createDto: CreateManufacturerDto) {
    const manufacturer = await this.manufacturerService.create(createDto);
    return {
      data: manufacturer,
      message: '新增制造商成功',
    };
  }

  @Put(':approval_no')
  async update(
    @Param('approval_no') approval_no: string,
    @Body() updateDto: UpdateManufacturerDto,
  ) {
    const manufacturer = await this.manufacturerService.update(
      approval_no,
      updateDto,
    );
    return {
      data: manufacturer,
      message: '修改制造商成功',
    };
  }

  @Delete(':approval_no')
  async remove(@Param('approval_no') approval_no: string) {
    const result = await this.manufacturerService.remove(approval_no);
    return {
      message: result ? '删除制造商成功' : '未找到该制造商，删除失败',
    };
  }
}
