import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Public } from '@/custom/Public';
import { PurchaseService } from './purchase.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';
import {
  CreatePurchaseDetailDto,
  UpdatePurchaseDetailDto,
} from './dto/purchase-detail.dto';
import { UpdatePurchaseStorageDto } from './dto/purchase-storage.dto';
import { SubmitPurchaseStorageDto } from './dto/submit-purchase-storage.dto';

@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Public()
  @Get('order')
  async findAllOrders() {
    return {
      data: await this.purchaseService.findAllOrders(),
      message: '获取采购订单列表成功',
    };
  }

  @Public()
  @Get('order/:order_no')
  async findOneOrder(@Param('order_no') orderNo: string) {
    return {
      data: await this.purchaseService.findOneOrder(orderNo),
      message: '获取采购订单详情成功',
    };
  }

  @Post('order')
  async createOrder(@Body() createDto: CreatePurchaseOrderDto) {
    return {
      data: await this.purchaseService.createOrder(createDto),
      message: '创建采购订单成功',
    };
  }

  @Put('order/:order_no')
  async updateOrder(
    @Param('order_no') orderNo: string,
    @Body() updateDto: UpdatePurchaseOrderDto,
  ) {
    return {
      data: await this.purchaseService.updateOrder(orderNo, updateDto),
      message: '更新采购订单成功',
    };
  }

  @Delete('order/:order_no')
  async removeOrder(@Param('order_no') orderNo: string) {
    await this.purchaseService.removeOrder(orderNo);
    return {
      message: '删除采购订单成功',
    };
  }

  @Public()
  @Get('detail')
  async findAllDetails() {
    return {
      data: await this.purchaseService.findAllDetails(),
      message: '获取采购明细列表成功',
    };
  }

  @Public()
  @Get('detail/:id')
  async findOneDetail(@Param('id') id: string) {
    return {
      data: await this.purchaseService.findOneDetail(+id),
      message: '获取采购明细详情成功',
    };
  }

  @Post('detail')
  async createDetail(@Body() createDto: CreatePurchaseDetailDto) {
    return {
      data: await this.purchaseService.createDetail(createDto),
      message: '创建采购明细成功',
    };
  }

  @Put('detail/:id')
  async updateDetail(
    @Param('id') id: string,
    @Body() updateDto: UpdatePurchaseDetailDto,
  ) {
    return {
      data: await this.purchaseService.updateDetail(+id, updateDto),
      message: '更新采购明细成功',
    };
  }

  @Delete('detail/:id')
  async removeDetail(@Param('id') id: string) {
    await this.purchaseService.removeDetail(+id);
    return {
      message: '删除采购明细成功',
    };
  }

  @Public()
  @Get('storage')
  async findAllStorages() {
    return {
      data: await this.purchaseService.findAllStorages(),
      message: '获取采购入库记录列表成功',
    };
  }

  @Public()
  @Get('storage/:id')
  async findOneStorage(@Param('id') id: string) {
    return {
      data: await this.purchaseService.findOneStorage(+id),
      message: '获取采购入库记录详情成功',
    };
  }

  @Post('storage')
  async createStorage(@Body() createDto: SubmitPurchaseStorageDto) {
    return {
      data: await this.purchaseService.createStorage(createDto),
      message: '提交采购入库成功',
    };
  }

  @Put('storage/:id')
  async updateStorage(
    @Param('id') id: string,
    @Body() updateDto: UpdatePurchaseStorageDto,
  ) {
    return {
      data: await this.purchaseService.updateStorage(+id, updateDto),
      message: '更新采购入库记录成功',
    };
  }

  @Delete('storage/:id')
  async removeStorage(@Param('id') id: string) {
    await this.purchaseService.removeStorage(+id);
    return {
      message: '删除采购入库记录成功',
    };
  }
}
