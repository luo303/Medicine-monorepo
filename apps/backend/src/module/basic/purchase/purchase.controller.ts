import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';
import {
  CreatePurchaseDetailDto,
  UpdatePurchaseDetailDto,
} from './dto/purchase-detail.dto';
import {
  CreatePurchaseStorageDto,
  UpdatePurchaseStorageDto,
} from './dto/purchase-storage.dto';
import { Public } from '@/custom/Public';

@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // 采购订单接口
  @Public()
  @Get('order')
  async findAllOrders() {
    const orders = await this.purchaseService.findAllOrders();
    return {
      data: orders,
      message: '获取采购订单列表成功',
    };
  }

  @Public()
  @Get('order/:order_no')
  async findOneOrder(@Param('order_no') order_no: string) {
    const order = await this.purchaseService.findOneOrder(order_no);
    return {
      data: order,
      message: order ? '获取采购订单详情成功' : '未找到该订单',
    };
  }

  @Post('order')
  async createOrder(@Body() createDto: CreatePurchaseOrderDto) {
    const order = await this.purchaseService.createOrder(createDto);
    return {
      data: order,
      message: '新增采购订单成功',
    };
  }

  @Put('order/:order_no')
  async updateOrder(
    @Param('order_no') order_no: string,
    @Body() updateDto: UpdatePurchaseOrderDto,
  ) {
    const order = await this.purchaseService.updateOrder(order_no, updateDto);
    return {
      data: order,
      message: '修改采购订单成功',
    };
  }

  @Delete('order/:order_no')
  async removeOrder(@Param('order_no') order_no: string) {
    const result = await this.purchaseService.removeOrder(order_no);
    return {
      message: result ? '删除采购订单成功' : '未找到该订单，删除失败',
    };
  }

  // 采购明细接口
  @Public()
  @Get('detail')
  async findAllDetails() {
    const details = await this.purchaseService.findAllDetails();
    return {
      data: details,
      message: '获取采购明细成功',
    };
  }

  @Public()
  @Get('detail/:id')
  async findOneDetail(@Param('id') id: string) {
    const detail = await this.purchaseService.findOneDetail(+id);
    return {
      data: detail,
      message: detail ? '获取采购明细详情成功' : '未找到该明细',
    };
  }

  @Post('detail')
  async createDetail(@Body() createDto: CreatePurchaseDetailDto) {
    const detail = await this.purchaseService.createDetail(createDto);
    return {
      data: detail,
      message: '创建采购明细成功',
    };
  }

  @Put('detail/:id')
  async updateDetail(
    @Param('id') id: string,
    @Body() updateDto: UpdatePurchaseDetailDto,
  ) {
    const detail = await this.purchaseService.updateDetail(+id, updateDto);
    return {
      data: detail,
      message: '修改采购明细成功',
    };
  }

  @Delete('detail/:id')
  async removeDetail(@Param('id') id: string) {
    const result = await this.purchaseService.removeDetail(+id);
    return {
      message: result ? '删除采购明细成功' : '未找到该明细，删除失败',
    };
  }

  // 采购入库接口
  @Public()
  @Get('storage')
  async findAllStorages() {
    const storages = await this.purchaseService.findAllStorages();
    return {
      data: storages,
      message: '获取采购入库记录成功',
    };
  }

  @Public()
  @Get('storage/:id')
  async findOneStorage(@Param('id') id: string) {
    const storage = await this.purchaseService.findOneStorage(+id);
    return {
      data: storage,
      message: storage ? '获取采购入库详情成功' : '未找到该入库记录',
    };
  }

  @Post('storage')
  async createStorage(@Body() createDto: CreatePurchaseStorageDto) {
    const storage = await this.purchaseService.createStorage(createDto);
    return {
      data: storage,
      message: '创建采购入库记录成功',
    };
  }

  @Put('storage/:id')
  async updateStorage(
    @Param('id') id: string,
    @Body() updateDto: UpdatePurchaseStorageDto,
  ) {
    const storage = await this.purchaseService.updateStorage(+id, updateDto);
    return {
      data: storage,
      message: '修改采购入库记录成功',
    };
  }

  @Delete('storage/:id')
  async removeStorage(@Param('id') id: string) {
    const result = await this.purchaseService.removeStorage(+id);
    return {
      message: result ? '删除采购入库记录成功' : '未找到该入库记录，删除失败',
    };
  }
}
