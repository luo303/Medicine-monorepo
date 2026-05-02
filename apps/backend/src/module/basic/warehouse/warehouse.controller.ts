import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Public } from '@/custom/Public';

@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Public()
  @Get()
  async findAll() {
    const warehouses = await this.warehouseService.findAll();
    return {
      data: warehouses,
      message: '获取仓库列表成功',
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const warehouse = await this.warehouseService.findOne(+id);
    return {
      data: warehouse,
      message: warehouse ? '获取仓库详情成功' : '未找到该仓库',
    };
  }

  @Post()
  async create(@Body() createDto: CreateWarehouseDto) {
    const warehouse = await this.warehouseService.create(createDto);
    return {
      data: warehouse,
      message: '新增仓库成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateWarehouseDto) {
    const warehouse = await this.warehouseService.update(+id, updateDto);
    return {
      data: warehouse,
      message: '修改仓库成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.warehouseService.remove(+id);
    return {
      message: result ? '删除仓库成功' : '未找到该仓库，删除失败',
    };
  }
}
