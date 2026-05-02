import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { StorageLocationService } from './storage-location.service';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';
import { Public } from '@/custom/Public';

@Controller('storage-location')
export class StorageLocationController {
  constructor(
    private readonly storageLocationService: StorageLocationService,
  ) {}

  @Public()
  @Get()
  async findAll() {
    const storageLocations = await this.storageLocationService.findAll();
    return {
      data: storageLocations,
      message: '获取货位列表成功',
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const storageLocation = await this.storageLocationService.findOne(+id);
    return {
      data: storageLocation,
      message: storageLocation ? '获取货位详情成功' : '未找到该货位',
    };
  }

  @Post()
  async create(@Body() createDto: CreateStorageLocationDto) {
    const storageLocation = await this.storageLocationService.create(createDto);
    return {
      data: storageLocation,
      message: '新增货位成功',
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStorageLocationDto,
  ) {
    const storageLocation = await this.storageLocationService.update(
      +id,
      updateDto,
    );
    return {
      data: storageLocation,
      message: '修改货位成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.storageLocationService.remove(+id);
    return {
      message: result ? '删除货位成功' : '未找到该货位，删除失败',
    };
  }
}
