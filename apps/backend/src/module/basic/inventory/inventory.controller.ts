import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Public } from '@/custom/Public';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get()
  async findAll() {
    const inventoryList = await this.inventoryService.findAll();
    return {
      data: inventoryList,
      message: '获取库存列表成功',
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const inventory = await this.inventoryService.findOne(+id);
    return {
      data: inventory,
      message: inventory ? '获取库存详情成功' : '未找到该库存记录',
    };
  }

  @Post()
  async create(@Body() createDto: CreateInventoryDto) {
    const inventory = await this.inventoryService.create(createDto);
    return {
      data: inventory,
      message: '新增库存记录成功',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateInventoryDto) {
    const inventory = await this.inventoryService.update(+id, updateDto);
    return {
      data: inventory,
      message: '修改库存记录成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.inventoryService.remove(+id);
    return {
      message: result ? '删除库存记录成功' : '未找到该库存记录，删除失败',
    };
  }
}
